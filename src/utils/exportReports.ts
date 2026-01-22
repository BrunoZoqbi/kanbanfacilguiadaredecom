import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { TaskWithRelations, Profile } from '@/types/database';
import { format, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportData {
  tasks: TaskWithRelations[];
  profiles: Profile[];
  period: string;
}

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

const statusLabels = {
  todo: 'A Fazer',
  doing: 'Fazendo',
  done: 'Feito',
};

export const generatePDFReport = (data: ReportData) => {
  const doc = new jsPDF();
  const now = new Date();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(60, 60, 60);
  doc.text('Fibrontec - Relatório Kanban', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 30);
  doc.text(`Período: Últimos ${data.period} dias`, 14, 36);
  
  // Summary stats
  const completedTasks = data.tasks.filter(t => t.status === 'done');
  const overdueTasks = data.tasks.filter(t => new Date(t.due_date) < now && t.status !== 'done');
  
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Resumo', 14, 48);
  
  doc.setFontSize(10);
  doc.text(`Total de tarefas: ${data.tasks.length}`, 14, 56);
  doc.text(`Concluídas: ${completedTasks.length}`, 14, 62);
  doc.text(`Atrasadas: ${overdueTasks.length}`, 14, 68);
  
  // Tasks table
  const tableData = data.tasks.map(task => {
    const assignee = data.profiles.find(p => p.id === task.assignee_id);
    return [
      task.title.substring(0, 30) + (task.title.length > 30 ? '...' : ''),
      assignee?.full_name || 'N/A',
      priorityLabels[task.priority],
      statusLabels[task.status],
      format(new Date(task.due_date), 'dd/MM/yyyy'),
    ];
  });

  autoTable(doc, {
    startY: 78,
    head: [['Tarefa', 'Responsável', 'Prioridade', 'Status', 'Prazo']],
    body: tableData,
    headStyles: { fillColor: [167, 224, 0], textColor: [30, 30, 30] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
    },
  });

  // User metrics table
  const userMetrics = data.profiles.map(profile => {
    const userTasks = data.tasks.filter(t => t.assignee_id === profile.id);
    const userCompleted = userTasks.filter(t => t.status === 'done');
    const userOverdue = userTasks.filter(t => new Date(t.due_date) < now && t.status !== 'done');
    
    return [
      profile.full_name,
      userTasks.length.toString(),
      userCompleted.length.toString(),
      userOverdue.length.toString(),
      userTasks.length > 0 
        ? `${Math.round((userCompleted.length / userTasks.length) * 100)}%`
        : '0%',
    ];
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(12);
  doc.text('Métricas por Usuário', 14, finalY);

  autoTable(doc, {
    startY: finalY + 6,
    head: [['Usuário', 'Total', 'Concluídas', 'Atrasadas', 'Taxa']],
    body: userMetrics,
    headStyles: { fillColor: [167, 224, 0], textColor: [30, 30, 30] },
    styles: { fontSize: 8 },
  });

  // Save
  doc.save(`fibrontec-relatorio-${format(now, 'yyyy-MM-dd')}.pdf`);
};

export const generateExcelReport = (data: ReportData) => {
  const now = new Date();
  
  // Tasks sheet
  const tasksData = data.tasks.map(task => {
    const assignee = data.profiles.find(p => p.id === task.assignee_id);
    const creator = data.profiles.find(p => p.id === task.created_by_id);
    
    return {
      'Título': task.title,
      'Descrição': task.description || '',
      'Responsável': assignee?.full_name || 'N/A',
      'Criado por': creator?.full_name || 'N/A',
      'Prioridade': priorityLabels[task.priority],
      'Status': statusLabels[task.status],
      'Tipo': task.task_type === 'daily' ? 'Diária' : 'Pontual',
      'Local': task.location || '',
      'Prazo': format(new Date(task.due_date), 'dd/MM/yyyy HH:mm'),
      'Criado em': format(new Date(task.created_at), 'dd/MM/yyyy HH:mm'),
      'Concluído em': task.completed_at 
        ? format(new Date(task.completed_at), 'dd/MM/yyyy HH:mm')
        : '',
    };
  });

  // User metrics sheet
  const userMetricsData = data.profiles.map(profile => {
    const userTasks = data.tasks.filter(t => t.assignee_id === profile.id);
    const userCompleted = userTasks.filter(t => t.status === 'done');
    const userOverdue = userTasks.filter(t => new Date(t.due_date) < now && t.status !== 'done');
    
    let avgTime = 0;
    let completedWithTime = 0;
    userCompleted.forEach(task => {
      if (task.completed_at) {
        avgTime += differenceInHours(new Date(task.completed_at), new Date(task.created_at));
        completedWithTime++;
      }
    });

    return {
      'Usuário': profile.full_name,
      'Total de Tarefas': userTasks.length,
      'Concluídas': userCompleted.length,
      'Em Andamento': userTasks.filter(t => t.status === 'doing').length,
      'A Fazer': userTasks.filter(t => t.status === 'todo').length,
      'Atrasadas': userOverdue.length,
      'Taxa de Conclusão': userTasks.length > 0 
        ? `${Math.round((userCompleted.length / userTasks.length) * 100)}%`
        : '0%',
      'Tempo Médio (horas)': completedWithTime > 0 
        ? Math.round(avgTime / completedWithTime)
        : 0,
    };
  });

  // Create workbook
  const wb = XLSX.utils.book_new();
  
  const wsTaskas = XLSX.utils.json_to_sheet(tasksData);
  XLSX.utils.book_append_sheet(wb, wsTaskas, 'Tarefas');
  
  const wsMetrics = XLSX.utils.json_to_sheet(userMetricsData);
  XLSX.utils.book_append_sheet(wb, wsMetrics, 'Métricas por Usuário');
  
  // Auto-width columns
  const maxWidth = 50;
  const wscols = Object.keys(tasksData[0] || {}).map(() => ({ wch: maxWidth }));
  wsTaskas['!cols'] = wscols;
  
  // Save
  XLSX.writeFile(wb, `fibrontec-relatorio-${format(now, 'yyyy-MM-dd')}.xlsx`);
};
