import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { MindMapCanvas } from './components/MindMap/MindMapCanvas';
import { Project, MindMapNodeData } from './types';

const App: React.FC = () => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  const handleSaveProject = (newData: MindMapNodeData) => {
    if (!currentProject) return;

    const updatedProject = {
      ...currentProject,
      data: newData,
      lastModified: Date.now(),
      // Name is now managed explicitly in the Dashboard, we preserve currentProject.name
    };

    setCurrentProject(updatedProject);

    // Persist to storage
    const saved = localStorage.getItem('mindflow_projects');
    const projects: Project[] = saved ? JSON.parse(saved) : [];
    const index = projects.findIndex(p => p.id === currentProject.id);
    
    if (index >= 0) {
      projects[index] = updatedProject;
    } else {
      projects.push(updatedProject);
    }
    
    localStorage.setItem('mindflow_projects', JSON.stringify(projects));
  };

  return (
    <div className="font-sans text-slate-900">
      {currentProject ? (
        <MindMapCanvas
          initialData={currentProject.data}
          onSave={handleSaveProject}
          onBack={() => setCurrentProject(null)}
          projectName={currentProject.name}
          onRenameProject={(name) => {
            const finalName = name.trim() || 'Untitled Mind Map';
            const updatedProject = { ...currentProject, name: finalName, lastModified: Date.now() };
            setCurrentProject(updatedProject);
            const saved = localStorage.getItem('mindflow_projects');
            const projects: Project[] = saved ? JSON.parse(saved) : [];
            const index = projects.findIndex(p => p.id === updatedProject.id);
            if (index >= 0) {
              projects[index] = updatedProject;
            } else {
              projects.push(updatedProject);
            }
            localStorage.setItem('mindflow_projects', JSON.stringify(projects));
          }}
        />
      ) : (
        <Dashboard onOpenProject={setCurrentProject} />
      )}
      
    </div>
  );
};

export default App;
