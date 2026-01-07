// Sunbelt color palette for projects
export const PROJECT_COLORS = [
  '#ff6b35', // Sunbelt Orange
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#64748b', // Slate
  '#ef4444', // Red
  '#14b8a6', // Teal
];

// Get color for a project (auto-assign based on index or use stored color)
export const getProjectColor = (project, index = 0) => {
  if (project?.color) return project.color;
  return PROJECT_COLORS[index % PROJECT_COLORS.length];
};

// Calendar item types
export const CALENDAR_ITEM_TYPES = {
  TASK: 'task',
  RFI: 'rfi',
  SUBMITTAL: 'submittal',
  MILESTONE: 'milestone',
  ONLINE_DATE: 'online_date',
  OFFLINE_DATE: 'offline_date',
  DELIVERY_DATE: 'delivery_date',
};

// Item type display config
export const ITEM_TYPE_CONFIG = {
  task: {
    label: 'Task',
    shortLabel: 'T',
    icon: 'CheckSquare',
  },
  rfi: {
    label: 'RFI',
    shortLabel: 'R',
    icon: 'MessageSquare',
  },
  submittal: {
    label: 'Submittal',
    shortLabel: 'S',
    icon: 'ClipboardList',
  },
  milestone: {
    label: 'Milestone',
    shortLabel: 'M',
    icon: 'Flag',
  },
  online_date: {
    label: 'Online',
    shortLabel: 'ON',
    icon: 'Play',
  },
  offline_date: {
    label: 'Offline',
    shortLabel: 'OFF',
    icon: 'Square',
  },
  delivery_date: {
    label: 'Delivery',
    shortLabel: 'D',
    icon: 'Truck',
  },
};

// Date helpers
export const getWeekDates = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  start.setDate(diff);
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
};

export const getMonthDates = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);
  
  // Start from the Monday of the week containing the first day
  const start = new Date(firstDay);
  const startDay = start.getDay();
  start.setDate(start.getDate() - (startDay === 0 ? 6 : startDay - 1));
  
  // End on the Sunday of the week containing the last day
  const end = new Date(lastDay);
  const endDay = end.getDay();
  if (endDay !== 0) {
    end.setDate(end.getDate() + (7 - endDay));
  }
  
  const dates = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

export const formatDateKey = (date) => {
  return date.toISOString().split('T')[0];
};

export const isSameDay = (date1, date2) => {
  return formatDateKey(new Date(date1)) === formatDateKey(new Date(date2));
};

export const isToday = (date) => {
  return isSameDay(date, new Date());
};

export const isPast = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
};

export const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
};

// Format date for display
export const formatDisplayDate = (date, format = 'short') => {
  const d = new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (format === 'long') {
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
  if (format === 'weekday') {
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }
  if (format === 'dayNum') {
    return d.getDate();
  }
  return d.toLocaleDateString();
};

// Get week range text
export const getWeekRangeText = (dates) => {
  if (!dates || dates.length === 0) return '';
  const start = dates[0];
  const end = dates[dates.length - 1];
  
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const year = end.getFullYear();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${year}`;
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
};

// Get month text
export const getMonthText = (date) => {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

// Build calendar items from project data
export const buildCalendarItems = (projects, tasks, rfis, submittals, milestones) => {
  const items = [];
  
  // Create a map of project colors
  const projectColorMap = {};
  projects?.forEach((project, index) => {
    projectColorMap[project.id] = getProjectColor(project, index);
  });

  // Add tasks
  tasks?.forEach(task => {
    if (task.due_date) {
      items.push({
        id: `task-${task.id}`,
        type: CALENDAR_ITEM_TYPES.TASK,
        title: task.title,
        date: task.due_date,
        projectId: task.project_id,
        projectName: task.project?.name || 'Unknown Project',
        projectNumber: task.project?.project_number,
        color: projectColorMap[task.project_id] || PROJECT_COLORS[0],
        status: task.status,
        data: task,
      });
    }
  });

  // Add RFIs
  rfis?.forEach(rfi => {
    if (rfi.due_date) {
      items.push({
        id: `rfi-${rfi.id}`,
        type: CALENDAR_ITEM_TYPES.RFI,
        title: `${rfi.rfi_number}: ${rfi.subject}`,
        date: rfi.due_date,
        projectId: rfi.project_id,
        projectName: rfi.project?.name || 'Unknown Project',
        projectNumber: rfi.project?.project_number,
        color: projectColorMap[rfi.project_id] || PROJECT_COLORS[0],
        status: rfi.status,
        data: rfi,
      });
    }
  });

  // Add submittals
  submittals?.forEach(sub => {
    if (sub.due_date) {
      items.push({
        id: `sub-${sub.id}`,
        type: CALENDAR_ITEM_TYPES.SUBMITTAL,
        title: `${sub.submittal_number}: ${sub.title}`,
        date: sub.due_date,
        projectId: sub.project_id,
        projectName: sub.project?.name || 'Unknown Project',
        projectNumber: sub.project?.project_number,
        color: projectColorMap[sub.project_id] || PROJECT_COLORS[0],
        status: sub.status,
        data: sub,
      });
    }
  });

  // Add milestones
  milestones?.forEach(milestone => {
    if (milestone.due_date) {
      items.push({
        id: `milestone-${milestone.id}`,
        type: CALENDAR_ITEM_TYPES.MILESTONE,
        title: milestone.name,
        date: milestone.due_date,
        projectId: milestone.project_id,
        projectName: milestone.project?.name || 'Unknown Project',
        projectNumber: milestone.project?.project_number,
        color: projectColorMap[milestone.project_id] || PROJECT_COLORS[0],
        status: milestone.status,
        data: milestone,
      });
    }
  });

  // Add project dates (online, offline, delivery)
  projects?.forEach((project, index) => {
    const color = getProjectColor(project, index);
    
    if (project.target_online_date) {
      items.push({
        id: `online-${project.id}`,
        type: CALENDAR_ITEM_TYPES.ONLINE_DATE,
        title: `${project.name} - Online`,
        date: project.target_online_date,
        projectId: project.id,
        projectName: project.name,
        projectNumber: project.project_number,
        color,
        status: project.status,
        data: project,
      });
    }
    
    if (project.target_offline_date) {
      items.push({
        id: `offline-${project.id}`,
        type: CALENDAR_ITEM_TYPES.OFFLINE_DATE,
        title: `${project.name} - Offline`,
        date: project.target_offline_date,
        projectId: project.id,
        projectName: project.name,
        projectNumber: project.project_number,
        color,
        status: project.status,
        data: project,
      });
    }
    
    if (project.delivery_date) {
      items.push({
        id: `delivery-${project.id}`,
        type: CALENDAR_ITEM_TYPES.DELIVERY_DATE,
        title: `${project.name} - Delivery`,
        date: project.delivery_date,
        projectId: project.id,
        projectName: project.name,
        projectNumber: project.project_number,
        color,
        status: project.status,
        data: project,
      });
    }
  });

  return items;
};

// Group items by date
export const groupItemsByDate = (items) => {
  const grouped = {};
  
  items.forEach(item => {
    const dateKey = formatDateKey(new Date(item.date));
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(item);
  });
  
  // Sort items within each day by type priority
  const typePriority = {
    online_date: 1,
    offline_date: 2,
    delivery_date: 3,
    milestone: 4,
    task: 5,
    rfi: 6,
    submittal: 7,
  };
  
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => typePriority[a.type] - typePriority[b.type]);
  });
  
  return grouped;
};