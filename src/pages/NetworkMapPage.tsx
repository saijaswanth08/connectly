import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Plus, ZoomIn, ZoomOut, Maximize2, X, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useContacts } from "@/hooks/useContacts";
import { useContactConnections, useCreateContactConnection, useDeleteContactConnection } from "@/hooks/useConnections";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DbContact } from "@/lib/api";
import { Link } from "react-router-dom";

const TAG_COLORS: Record<string, string> = {
  investor: "#8b5cf6",
  client: "#22c55e",
  mentor: "#f59e0b",
  partner: "#3b82f6",
  recruiter: "#ec4899",
  friend: "#06b6d4",
  colleague: "#6366f1",
};

const DEFAULT_COLOR = "#6477b8";

function getNodeColor(tags: string[]): string {
  for (const tag of tags) {
    if (TAG_COLORS[tag.toLowerCase()]) return TAG_COLORS[tag.toLowerCase()];
  }
  return DEFAULT_COLOR;
}

interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  name: string;
  initials: string;
  color: string;
  tags: string[];
  importance: string;
  contact: DbContact;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
}

export default function NetworkMapPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: contacts = [], isLoading: loadingContacts, isError: errorContacts } = useContacts();
  const { data: connections = [], isLoading: loadingConns, isError: errorConns } = useContactConnections();
  const createConnection = useCreateContactConnection();
  const deleteConnection = useDeleteContactConnection();

  const isError = errorContacts || errorConns;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const energyRef = useRef<number>(100);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedContact, setSelectedContact] = useState<DbContact | null>(null);
  const [addConnOpen, setAddConnOpen] = useState(false);
  const [connContactA, setConnContactA] = useState("");
  const [connContactB, setConnContactB] = useState("");
  const [connType, setConnType] = useState("colleague");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Sync refs for animation loop
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef<string | null>(null);
  const highlightedIdRef = useRef<string | null>(null);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { draggingRef.current = dragging; }, [dragging]);
  useEffect(() => { highlightedIdRef.current = highlightedId; }, [highlightedId]);

  const isLoading = loadingContacts || loadingConns;

  // Build nodes
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (filter !== "all" && !(c.tags || []).some((t) => t.toLowerCase() === filter)) return false;
      return true;
    });
  }, [contacts, filter]);

  // Initialize nodes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;

    nodesRef.current = filteredContacts.map((c, i) => {
      const existing = nodesRef.current.find((n) => n.id === c.id);
      const angle = (2 * Math.PI * i) / filteredContacts.length;
      const radius = Math.min(w, h) * 0.3;
      return {
        id: c.id,
        x: existing?.x ?? w / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
        y: existing?.y ?? h / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        name: c.name,
        initials: c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
        color: getNodeColor(c.tags || []),
        tags: c.tags || [],
        importance: c.importance,
        contact: c,
      };
    });

    edgesRef.current = connections.map((conn) => ({
      id: conn.id,
      source: conn.contact_id_a,
      target: conn.contact_id_b,
      type: conn.relationship_type,
    }));
    
    energyRef.current = 100; // Wake up simulation on change
  }, [filteredContacts, connections]);

  // Search highlight
  useEffect(() => {
    if (!search.trim()) { setHighlightedId(null); return; }
    const found = contacts.find((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    setHighlightedId(found?.id || null);
  }, [search, contacts]);

  // Force simulation + render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;

      // Force simulation
      let currentEnergy = 0;
      if (energyRef.current > 0.01) {
        for (let i = 0; i < nodes.length; i++) {
          const nodeI = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const nodeJ = nodes[j];
            const dx = nodeJ.x - nodeI.x;
            const dy = nodeJ.y - nodeI.y;
            const distSq = dx * dx + dy * dy || 1;
            const dist = Math.sqrt(distSq);
            const repulsion = 3000 / distSq;
            const fx = (dx / dist) * repulsion;
            const fy = (dy / dist) * repulsion;
            nodeI.vx -= fx;
            nodeI.vy -= fy;
            nodeJ.vx += fx;
            nodeJ.vy += fy;
          }
        }

        // Edge attraction
        for (const edge of edges) {
          const a = nodes.find((n) => n.id === edge.source);
          const b = nodes.find((n) => n.id === edge.target);
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const attraction = (dist - 150) * 0.005;
          const fx = (dx / dist) * attraction;
          const fy = (dy / dist) * attraction;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }

        // Center gravity and move
        for (const node of nodes) {
          node.vx += (w / 2 - node.x) * 0.001;
          node.vy += (h / 2 - node.y) * 0.001;
          node.vx *= 0.9;
          node.vy *= 0.9;
          if (node.id !== draggingRef.current) {
            node.x += node.vx;
            node.y += node.vy;
            currentEnergy += node.vx * node.vx + node.vy * node.vy;
          }
          node.x = Math.max(30, Math.min(w - 30, node.x));
          node.y = Math.max(30, Math.min(h - 30, node.y));
        }
        energyRef.current = currentEnergy / nodes.length;
      }

      // Render
      ctx.save();
      ctx.clearRect(0, 0, w, h);
      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(zoomRef.current, zoomRef.current);

      // Edges
      for (const edge of edges) {
        const a = nodes.find((n) => n.id === edge.source);
        const b = nodes.find((n) => n.id === edge.target);
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a.x ?? 0, a.y ?? 0);
        ctx.lineTo(b.x ?? 0, b.y ?? 0);
        ctx.strokeStyle = "rgba(148,163,184,0.35)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        const mx = ((a.x ?? 0) + (b.x ?? 0)) / 2;
        const my = ((a.y ?? 0) + (b.y ?? 0)) / 2;
        ctx.font = "9px sans-serif";
        ctx.fillStyle = "rgba(148,163,184,0.7)";
        ctx.textAlign = "center";
        ctx.fillText(edge.type || "", mx, my - 4);
      }

      // Nodes
      for (const node of nodes) {
        const isHighlighted = highlightedIdRef.current === node.id;
        const radius = node.importance === "vip" ? 28 : 22;
        const nx = node.x ?? 0;
        const ny = node.y ?? 0;

        // Glow for highlighted
        if (isHighlighted) {
          ctx.beginPath();
          ctx.arc(nx, ny, radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(59,130,246,0.2)";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(nx, ny, radius + 4, 0, Math.PI * 2);
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        // Circle
        ctx.beginPath();
        ctx.arc(nx, ny, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color || DEFAULT_COLOR;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Initials
        ctx.font = `bold ${radius * 0.65}px sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.initials || "", nx, ny);

        // Name below
        ctx.font = "11px sans-serif";
        ctx.fillStyle = "rgba(71,85,105,0.9)";
        ctx.fillText(node.name || "", nx, ny + radius + 14);
      }

      ctx.restore();
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [filteredContacts.length, connections.length]);

  // Mouse handlers
  const getCanvasPos = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  }, [zoom, pan]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = getCanvasPos(e);
    const node = nodesRef.current.find((n) => {
      const r = n.importance === "vip" ? 28 : 22;
      return Math.sqrt((pos.x - n.x) ** 2 + (pos.y - n.y) ** 2) < r;
    });
    if (node) {
      setDragging(node.id);
    } else {
      setPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [getCanvasPos, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      const pos = getCanvasPos(e);
      const node = nodesRef.current.find((n) => n.id === dragging);
      if (node) { node.x = pos.x; node.y = pos.y; node.vx = 0; node.vy = 0; }
    } else if (panning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
    if (dragging || panning) energyRef.current = 100; // Wake up
  }, [dragging, panning, panStart, getCanvasPos]);

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      // Check if it was a click (not a drag)
      const node = nodesRef.current.find((n) => n.id === dragging);
      if (node) setSelectedContact(node.contact);
    }
    setDragging(null);
    setPanning(false);
  }, [dragging]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)));
  }, []);

  async function handleAddConnection() {
    if (!user || !connContactA || !connContactB || connContactA === connContactB) return;
    try {
      await createConnection.mutateAsync({
        user_id: user.id,
        contact_id_a: connContactA,
        contact_id_b: connContactB,
        relationship_type: connType,
      });
      toast({ title: "Connection added" });
      setAddConnOpen(false);
      setConnContactA("");
      setConnContactB("");
      setConnType("colleague");
    } catch {
      toast({ title: "Error adding connection", variant: "destructive" });
    }
  }

  if (isLoading && !isError) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Network Map</h1>
          <p className="text-sm text-muted-foreground">Visualize how your professional connections are linked.</p>
        </div>
        <Button onClick={() => setAddConnOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Connection
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts…" className="pl-9 bg-card border-border/50" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-card border-border/50">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Contacts</SelectItem>
            <SelectItem value="investor">Investors</SelectItem>
            <SelectItem value="client">Clients</SelectItem>
            <SelectItem value="mentor">Mentors</SelectItem>
            <SelectItem value="partner">Partners</SelectItem>
            <SelectItem value="friend">Friends</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button size="icon" variant="outline" onClick={() => setZoom((z) => Math.min(3, z + 0.2))}><ZoomIn className="h-4 w-4" /></Button>
          <Button size="icon" variant="outline" onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}><ZoomOut className="h-4 w-4" /></Button>
          <Button size="icon" variant="outline" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><Maximize2 className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs shrink-0">
        {Object.entries(TAG_COLORS).map(([tag, color]) => (
          <span key={tag} className="flex items-center gap-1.5 capitalize">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            {tag}
          </span>
        ))}
      </div>

      {/* Graph Canvas */}
      {(contacts.length === 0 || isError) ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <Network className="h-8 w-8 text-accent-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {isError ? "Could not load network map" : "No connections yet."}
          </h2>
          <p className="text-muted-foreground mb-4 text-sm">
            {isError ? "Please check your connection and try again." : "Start by adding contacts to build your network."}
          </p>
          {!isError && <Button asChild><Link to="/dashboard">Add your first contact</Link></Button>}
        </div>
      ) : (
        <div className="flex-1 rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />
        </div>
      )}

      {/* Contact Profile Sheet */}
      <Sheet open={!!selectedContact} onOpenChange={(open) => { if (!open) setSelectedContact(null); }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="font-display">{selectedContact?.name}</SheetTitle>
          </SheetHeader>
          {selectedContact && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2 text-sm">
                {selectedContact.company && <p className="text-muted-foreground">{selectedContact.job_title ? `${selectedContact.job_title} at ${selectedContact.company}` : selectedContact.company}</p>}
                {selectedContact.email && <p className="text-muted-foreground">{selectedContact.email}</p>}
                {selectedContact.phone && <p className="text-muted-foreground">{selectedContact.phone}</p>}
              </div>
              {selectedContact.tags && selectedContact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedContact.tags.map((t) => (
                    <span key={t} className="rounded-full bg-accent text-accent-foreground px-2.5 py-0.5 text-xs font-medium">{t}</span>
                  ))}
                </div>
              )}
              {selectedContact.notes && (
                <div>
                  <p className="text-sm font-semibold mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{selectedContact.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/dashboard/contacts/${selectedContact.id}`}>View Full Profile</Link>
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Connection Dialog */}
      <Dialog open={addConnOpen} onOpenChange={setAddConnOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Connection</DialogTitle>
            <DialogDescription>Link two contacts in your network</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Contact A</Label>
              <Select value={connContactA} onValueChange={setConnContactA}>
                <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contact B</Label>
              <Select value={connContactB} onValueChange={setConnContactB}>
                <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                <SelectContent>
                  {contacts.filter((c) => c.id !== connContactA).map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Relationship Type</Label>
              <Select value={connType} onValueChange={setConnType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="colleague">Colleague</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                  <SelectItem value="mentor">Mentor</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddConnOpen(false)}>Cancel</Button>
            <Button onClick={handleAddConnection} disabled={!connContactA || !connContactB || createConnection.isPending}>Add Connection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
