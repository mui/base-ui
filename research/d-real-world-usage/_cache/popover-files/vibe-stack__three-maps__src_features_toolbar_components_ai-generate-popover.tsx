'use client';

import React from 'react';
import { useSelection, useSelectionStore } from '@/stores/selection-store';
import { useSceneStore } from '@/stores/scene-store';
import { useGeometryStore } from '@/stores/geometry-store';
import { SparklesIcon, SquareIcon, ArrowUpIcon } from 'lucide-react';
import { Popover } from '@base-ui-components/react/popover';
import { nanoid } from 'nanoid';
import { Pill } from './pill';

// --- AI Mesh Generation Popover Component ---
export const AIGeneratePopover: React.FC = () => {
  const scene = useSceneStore();
  const geometryStore = useGeometryStore();
  const selection = useSelection();
  const selectionActions = useSelectionStore();
  const [open, setOpen] = React.useState(false);
  const [prompt, setPrompt] = React.useState('');
  const [model, setModel] = React.useState<'gpt-5' | 'gpt-5-mini' | 'gpt-5-nano' | 'grok-4'>('grok-4');
  const [loading, setLoading] = React.useState(false);
  const [streaming, setStreaming] = React.useState(false); // true once first chunk arrives
  const abortRef = React.useRef<AbortController | null>(null);
  const workingMeshId = React.useRef<string | null>(null);
  const workingObjectId = React.useRef<string | null>(null);
  const nameLockedRef = React.useRef(false);

  const resetState = () => {
    setLoading(false);
    abortRef.current = null;
    workingMeshId.current = null;
    workingObjectId.current = null;
    setPrompt('');
  };

  const ensureWorkingMesh = (name?: string) => {
    if (workingMeshId.current) return workingMeshId.current;
    const id = nanoid();
    // Create empty mesh resource
    geometryStore.addMesh({
      id,
      name: name || 'AI Mesh',
      vertices: [],
      edges: [],
      faces: [],
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      visible: true,
      locked: false,
      shading: 'flat'
    } as any);
    // Create scene object wrapper
    const baseName = name || `AI Mesh ${id.slice(-4)}`;
    const objId = scene.createMeshObject(baseName , id);
    scene.selectObject(objId);
    if (selection.viewMode === 'object') selectionActions.selectObjects([objId]);
    workingMeshId.current = id;
    workingObjectId.current = objId;
    return id;
  };

  const stop = () => {
    abortRef.current?.abort();
    resetState();
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    if (loading) return;
  setLoading(true);
  setStreaming(false);
    const controller = new AbortController();
    abortRef.current = controller;
    ensureWorkingMesh();

    try {
      const res = await fetch('/api/generate-object', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error('Network error');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
  while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.error) continue;
              const meshPart = data.mesh;
      if (meshPart && !streaming) setStreaming(true);
              if (meshPart) updateMeshFromPartial(meshPart);
            } catch {/* ignore parse errors until more arrives */}
        }
      }
    } catch {
      // aborted or failed
    } finally {
      resetState();
    }
  };

  const updateMeshFromPartial = (meshData: any) => {
    const meshId = ensureWorkingMesh(meshData.name);
    const { vertices = [], faces = [], material, name } = meshData;
    // If name provided and we have an object, update its name once (avoid flickering if model refines name)
    if (name && workingObjectId.current && !nameLockedRef.current) {
      const objId = workingObjectId.current;
      if (scene.objects[objId]) {
        scene.updateObject(objId, (o: any) => { o.name = name; });
        nameLockedRef.current = true;
      }
    }
    // Build vertices array difference
  geometryStore.updateMesh(meshId, (m: any) => {
      // Only append / replace full arrays (simpler). We'll rebuild edges each time? Use replaceGeometry for topology to auto-normals.
      // Need vertex objects
      const verts = vertices.map((pos: any, i: number) => ({
        id: m.vertices[i]?.id || nanoid(),
        position: { x: pos.x ?? pos[0] ?? 0, y: pos.y ?? pos[1] ?? 0, z: pos.z ?? pos[2] ?? 0 },
        normal: { x: 0, y: 0, z: 0 },
        uv: { x: 0, y: 0 },
        selected: false,
      }));
      // Faces referencing vertex indices
      const f = faces.map((arr: number[], i: number) => ({
        id: m.faces[i]?.id || nanoid(),
        vertexIds: arr.map((idx) => verts[idx]?.id).filter(Boolean),
        normal: { x: 0, y: 0, z: 0 },
        selected: false,
      }));
      m.vertices = verts;
      m.faces = f;
      // edges will be rebuilt by replaceGeometry util if we wanted; quick local rebuild:
      const edgeKey = new Map<string, any>();
      for (const face of f) {
        for (let i = 0; i < face.vertexIds.length; i++) {
          const a = face.vertexIds[i];
            const b = face.vertexIds[(i + 1) % face.vertexIds.length];
            const key = a < b ? `${a}_${b}` : `${b}_${a}`;
            if (!edgeKey.has(key)) edgeKey.set(key, { id: nanoid(), vertexIds: [a, b] as [string,string], faceIds: [face.id], selected: false });
            else edgeKey.get(key).faceIds.push(face.id);
        }
      }
      m.edges = Array.from(edgeKey.values());
      // Simple normal recompute (face normals naive -> vertex average)
      const faceNormals: Record<string, { x: number; y: number; z: number }> = {};
  const vById: Record<string, any> = Object.fromEntries(verts.map((v: any) => [v.id, v]));
      for (const face of f) {
        if (face.vertexIds.length < 3) continue;
        const va = vById[face.vertexIds[0]].position;
        const vb = vById[face.vertexIds[1]].position;
        const vc = vById[face.vertexIds[2]].position;
        const ax = vb.x - va.x, ay = vb.y - va.y, az = vb.z - va.z;
        const bx = vc.x - va.x, by = vc.y - va.y, bz = vc.z - va.z;
        const nx = ay * bz - az * by;
        const ny = az * bx - ax * bz;
        const nz = ax * by - ay * bx;
        face.normal = { x: nx, y: ny, z: nz };
        faceNormals[face.id] = face.normal;
      }
      // Zero accumulate
      for (const v of verts) v.normal = { x: 0, y: 0, z: 0 };
      for (const face of f) {
        for (const vid of face.vertexIds) {
          const n = face.normal; const v = vById[vid];
          v.normal.x += n.x; v.normal.y += n.y; v.normal.z += n.z;
        }
      }
      for (const v of verts) {
        const len = Math.hypot(v.normal.x, v.normal.y, v.normal.z) || 1;
        v.normal.x /= len; v.normal.y /= len; v.normal.z /= len;
      }
    });

  if (material) {
      const parseColor = (c: any) => {
        if (!c) return { x: 0.8, y: 0.8, z: 0.8 };
        // Hex string #RRGGBB
        if (typeof c === 'string') {
          const hex = c.startsWith('#') ? c.slice(1) : c;
          if (/^[0-9a-fA-F]{6}$/.test(hex)) {
            const r = parseInt(hex.slice(0,2),16);
            const g = parseInt(hex.slice(2,4),16);
            const b = parseInt(hex.slice(4,6),16);
            return { x: r, y: g, z: b };
          }
        }
        // {r,g,b}
        if (typeof c === 'object' && 'r' in c && 'g' in c && 'b' in c) {
          return { x: c.r, y: c.g, z: c.b };
        }
        // {x,y,z} 0..1 floats (fallback); scale to 0..255
        if (typeof c === 'object' && 'x' in c && 'y' in c && 'z' in c) {
          return { x: Math.round((c.x ?? 0.8) * 255), y: Math.round((c.y ?? 0.8) * 255), z: Math.round((c.z ?? 0.8) * 255) };
        }
        // array [r,g,b]
        if (Array.isArray(c) && c.length >= 3) {
          const [r,g,b] = c; return { x: r, y: g, z: b };
        }
        return { x: 200, y: 200, z: 210 };
      };
      const colVec = parseColor(material.color);
      // Always create a brand new material per update on first material appearance for this mesh
      // After first creation for this mesh in this generation, update that single material (not reusing others)
      if (!(updateMeshFromPartial as any)._aiMaterialIdMap) (updateMeshFromPartial as any)._aiMaterialIdMap = {} as Record<string,string>;
      const map: Record<string,string> = (updateMeshFromPartial as any)._aiMaterialIdMap;
      if (!map[meshId]) {
        map[meshId] = `ai-${meshId}-${nanoid(6)}`;
        geometryStore.addMaterial({
          id: map[meshId],
          name: name ? `${name} Mat` : 'AI Material',
          color: colVec,
          roughness: material.roughness ?? 0.8,
          metalness: material.metalness ?? 0.05,
          emissive: material.emissive ? parseColor(material.emissive) : { x: 0, y: 0, z: 0 },
          emissiveIntensity: material.emissiveIntensity ?? 1,
        });
        // Ensure shader graph nodes reflect initial values
        geometryStore.ensureDefaultGraph(map[meshId]);
        // Update const nodes for color / rough / metal / emissive / emissiveIntensity
        const graph = geometryStore.shaderGraphs.get(map[meshId]);
        if (graph) {
          geometryStore.updateShaderGraph(map[meshId], (g: any) => {
            const colorNode = g.nodes.find((n: any) => n.id === 'color'); if (colorNode) colorNode.data = { r: colVec.x/255, g: colVec.y/255, b: colVec.z/255 };
            const roughNode = g.nodes.find((n: any) => n.id === 'rough'); if (roughNode && material.roughness !== undefined) roughNode.data = { value: material.roughness };
            const metalNode = g.nodes.find((n: any) => n.id === 'metal'); if (metalNode && material.metalness !== undefined) metalNode.data = { value: material.metalness };
            const emissiveNode = g.nodes.find((n: any) => n.id === 'emissive'); if (emissiveNode && material.emissive) { const ev = parseColor(material.emissive); emissiveNode.data = { r: ev.x/255, g: ev.y/255, b: ev.z/255 }; }
            const emissiveIntensityNode = g.nodes.find((n: any) => n.id === 'emissiveIntensity'); if (emissiveIntensityNode && material.emissiveIntensity !== undefined) emissiveIntensityNode.data = { value: material.emissiveIntensity };
          });
        }
      } else {
        geometryStore.updateMaterial(map[meshId], (mat: any) => {
          if (material.color) mat.color = colVec;
          if (material.roughness !== undefined) mat.roughness = material.roughness;
          if (material.metalness !== undefined) mat.metalness = material.metalness;
          if (material.emissive) mat.emissive = parseColor(material.emissive);
          if (material.emissiveIntensity !== undefined) mat.emissiveIntensity = material.emissiveIntensity;
        });
        // Also sync shader graph nodes for live updates
        geometryStore.updateShaderGraph(map[meshId], (g: any) => {
          if (material.color) { const ev = colVec; const colorNode = g.nodes.find((n: any) => n.id === 'color'); if (colorNode) colorNode.data = { r: ev.x/255, g: ev.y/255, b: ev.z/255 }; }
          if (material.roughness !== undefined) { const n = g.nodes.find((n: any) => n.id === 'rough'); if (n) n.data = { value: material.roughness }; }
          if (material.metalness !== undefined) { const n = g.nodes.find((n: any) => n.id === 'metal'); if (n) n.data = { value: material.metalness }; }
          if (material.emissive) { const ev = parseColor(material.emissive); const n = g.nodes.find((n: any) => n.id === 'emissive'); if (n) n.data = { r: ev.x/255, g: ev.y/255, b: ev.z/255 }; }
          if (material.emissiveIntensity !== undefined) { const n = g.nodes.find((n: any) => n.id === 'emissiveIntensity'); if (n) n.data = { value: material.emissiveIntensity }; }
        });
      }
      const matId = map[meshId];
      geometryStore.updateMesh(meshId, (m: any) => { m.materialId = matId; });
      // TODO: transparency pipeline integration if material.opacity provided (store lacks opacity field now)
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger>
        {/* Transparent, fully-rounded trigger (override Pill defaults) */}
        <Pill className='px-2 py-1 rounded-full cursor-pointer'>
          <SparklesIcon className='w-4 h-4 m-1 text-green-200' />
        </Pill>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className='z-50'>
          <Popover.Popup className='bg-neutral-900/60 backdrop-blur-md rounded-xl shadow-xl p-4 w-[420px] text-sm flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <Popover.Title className='text-white font-medium'>Generate Object</Popover.Title>
              <Popover.Close className='text-gray-400 hover:text-white text-xs px-2 py-1 rounded'>✕</Popover.Close>
            </div>
            <div className='flex flex-col gap-2'>
              <textarea
                value={prompt}
                disabled={loading}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='Describe the object (e.g., "a low poly tree" )'
                className='w-full resize-none h-24 bg-black/20 border-0 border-transparent rounded-md px-2 py-1 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-0'
              />
              <div className='flex items-center justify-between gap-3'>
                <select
                  value={model}
                  disabled={loading}
                  onChange={(e) => setModel(e.target.value as any)}
                  className='bg-black/20 text-xs rounded px-2 py-1 text-white focus:outline-none focus:ring-0'
                >
                  <option value="grok-4">grok-4 (xAI)</option>
                  <option value='gpt-5'>gpt-5 (OpenAI)</option>
                  <option value='gpt-5-mini'>gpt-5-mini (OpenAI)</option>
                  <option value='gpt-5-nano'>gpt-5-nano (OpenAI)</option>
                </select>
                <div className='flex-1 min-w-[120px] h-5 flex items-center'>
                  {loading && !streaming && (
                    <span className='text-[10px] text-purple-300 animate-pulse flex items-center gap-1'>
                      <span className='inline-block w-3 h-3 rounded-full bg-purple-400/60 animate-ping'></span>
                      AI is thinking...
                    </span>
                  )}
                  {loading && streaming && (
                    <span className='text-[10px] text-emerald-300 animate-pulse flex items-center gap-1'>
                      <span className='inline-block w-3 h-3 rounded-full bg-emerald-400/60 animate-ping'></span>
                      Building...
                    </span>
                  )}
                </div>
                <button
                  onClick={loading ? stop : handleSubmit}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-0 bg-transparent ${loading ? 'text-red-400' : 'text-green-400'} transition-colors`}
                  title={loading ? 'Stop' : 'Generate'}
                >
                  {loading ? <SquareIcon className='w-4 h-4' /> : <ArrowUpIcon className='w-4 h-4' />}
                </button>
              </div>
            </div>
            <div />
            {/* <p className='text-[10px] text-gray-400 leading-relaxed'>Model will stream geometry JSON. Mesh updates live. Keep prompts concise for faster generation.</p> */}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};