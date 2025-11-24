import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { INITIAL_DATA } from '../constants';
import { cn, generateId } from '../utils/cn';
import { Button } from './ui/Button';
import { Plus, FileText, Clock, Trash2, Pencil, Check, X } from 'lucide-react';

interface DashboardProps {
  onOpenProject: (project: Project) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('mindflow_projects');
    if (saved) {
      const loaded: Project[] = JSON.parse(saved);
      loaded.sort((a, b) => b.lastModified - a.lastModified);
      setProjects(loaded);
    }
  }, []);

  const createProject = () => {
    const newProject: Project = {
      id: generateId(),
      name: 'Untitled Mind Map',
      lastModified: Date.now(),
      data: JSON.parse(JSON.stringify(INITIAL_DATA)) // Deep copy
    };
    const updated = [newProject, ...projects];
    setProjects(updated);
    localStorage.setItem('mindflow_projects', JSON.stringify(updated));
    onOpenProject(newProject);
  };

  const deleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localStorage.setItem('mindflow_projects', JSON.stringify(updated));
  };

  const startEditing = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingId(project.id);
    setTempName(project.name);
  };

  const handleRename = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (!editingId) return;
    
    const finalName = tempName.trim() || 'Untitled Mind Map';
    const updated = projects.map(p => 
      p.id === editingId ? { ...p, name: finalName } : p
    );
    
    setProjects(updated);
    localStorage.setItem('mindflow_projects', JSON.stringify(updated));
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingId(null);
  };

  const filteredProjects = projects.filter(p => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.data?.text || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 p-8 sm:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">MindAI</h1>
            <div className="relative flex-1 sm:w-80">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm project..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21l-4.3-4.3M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
          <Button size="lg" onClick={createProject} className="shadow-indigo-500/20 gap-2">
            <Plus size={20} /> New Mind Map
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* New Project Card (Visual shortcut) */}
          <button 
            onClick={createProject}
            className="group flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all duration-200"
          >
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
               <Plus size={32} className="text-slate-400 group-hover:text-indigo-600" />
            </div>
            <span className="font-semibold text-slate-500 group-hover:text-indigo-600">Create New</span>
          </button>

            {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => onOpenProject(project)}
              className="group relative bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-200 border border-slate-100 hover:border-indigo-100 cursor-pointer flex flex-col justify-between h-48"
            >
               <div>
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg mb-3 flex items-center justify-center shadow-md shadow-indigo-500/20">
                      <FileText className="text-white" size={20} />
                  </div>

                  {/* Editable Title */}
                  {editingId === project.id ? (
                    <div className="flex items-center gap-1 mb-1" onClick={e => e.stopPropagation()}>
                        <input 
                            autoFocus
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename(e);
                                if (e.key === 'Escape') {
                                    setEditingId(null);
                                    e.stopPropagation();
                                }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 min-w-0 bg-slate-50 border-b-2 border-indigo-500 text-lg font-bold text-slate-800 outline-none px-1 rounded-t pb-1"
                        />
                        <button 
                            onClick={handleRename}
                            className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
                        >
                            <Check size={16} />
                        </button>
                        <button 
                            onClick={cancelEditing}
                            className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                  ) : (
                    <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors" title={project.name}>
                        {project.name}
                    </h3>
                  )}
                  
                  <p className="text-slate-500 text-xs line-clamp-2">
                    {project.data.children.length} main topics • Root: "{project.data.text}"
                  </p>
               </div>
               
               <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                 <div className="flex items-center text-xs text-slate-400 gap-1">
                   <Clock size={12} />
                   {new Date(project.lastModified).toLocaleDateString()}
                 </div>
                 
                 {/* Actions */}
                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                       onClick={(e) => startEditing(e, project)}
                       className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                       title="Rename Project"
                    >
                       <Pencil size={16} />
                    </button>
                    <button 
                       onClick={(e) => deleteProject(e, project.id)}
                       className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                       title="Delete Project"
                    >
                       <Trash2 size={16} />
                    </button>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
