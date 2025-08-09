import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Button,
  Select,
  Input,
  Textarea,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useToast,
  Spinner,
  Badge,
  Flex,
  ButtonGroup
} from '@chakra-ui/react';
import { MdEdit, MdDelete, MdPlayArrow, MdStop } from 'react-icons/md';
import { useTimeEntries } from '../contexts/TimeEntryContext';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext'; // useAuthをインポート
import { TimeEntry, Task } from '../types'; // ProjectとTaskをインポート

const TimeTracking = () => {
  const { projects } = useProjects();
  const { user } = useAuth();
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    return localStorage.getItem('timeTracking_selectedProjectId') || '';
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string>(() => {
    return localStorage.getItem('timeTracking_selectedTaskId') || '';
  });
  const [duration, setDuration] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [selectedTimeEntry, setSelectedTimeEntry] = useState<TimeEntry | null>(null); // 編集用
  const [currentTime, setCurrentTime] = useState<Date>(new Date()); // リアルタイム時間表示用
  const [currentPage, setCurrentPage] = useState<number>(1);
  const entriesPerPage = 20;
  
  const toast = useToast();
  
  const { 
    timeEntries, 
    isLoading, 
    fetchTimeEntries, 
    addTimeEntry, 
    updateTimeEntry, 
    deleteTimeEntry,
    startTimer,
    stopTimer,
    activeEntry 
  } = useTimeEntries();

  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find(p => (p._id || p.id) === selectedProjectId);
      if (project) {
        setTasks(project.tasks || []);
      } else {
        setTasks([]);
      }
    } else {
      setTasks([]);
    }
  }, [selectedProjectId, projects]);

  useEffect(() => {
    fetchTimeEntries();
  }, [fetchTimeEntries]);

  // Save selected project and task to localStorage
  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('timeTracking_selectedProjectId', selectedProjectId);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedTaskId) {
      localStorage.setItem('timeTracking_selectedTaskId', selectedTaskId);
    }
  }, [selectedTaskId]);

  // タイマーが動いている間のリアルタイム更新
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeEntry) {
      interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000); // 1秒ごとに更新
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeEntry]);

  useEffect(() => {
    if (selectedTimeEntry) {
      setDate(selectedTimeEntry.date);
      
      // プロジェクトIDを設定
      const projectId = selectedTimeEntry.project?._id || selectedTimeEntry.project?.id;
      setSelectedProjectId(projectId);
      
      // プロジェクトのタスクを取得してタスクIDを設定
      const project = projects.find(p => (p._id || p.id) === projectId);
      if (project && project.tasks) {
        // タスク名からタスクIDを見つける
        const task = project.tasks.find(t => t.name === selectedTimeEntry.task);
        if (task) {
          setSelectedTaskId(task._id || task.id || task.name);
        } else {
          setSelectedTaskId('');
        }
      }
      
      setDuration(formatDuration(selectedTimeEntry.duration || selectedTimeEntry.hours, selectedTimeEntry.hours !== undefined));
      setNotes(selectedTimeEntry.notes || '');
    }
  }, [selectedTimeEntry, projects]);

  // Helper function to format duration
  const formatDuration = (value: number | undefined, isHours: boolean = false) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0h 0m';
    }
    
    const seconds = isHours ? value * 3600 : value;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Helper function to format entry time
  const formatEntryTime = (entry: TimeEntry) => {
    // 開始時刻がある場合（タイマー実行中）
    if (entry.startTime) {
      let startDate: Date;
      if (typeof entry.startTime === 'object' && '_seconds' in entry.startTime) {
        startDate = new Date(entry.startTime._seconds * 1000);
      } else {
        startDate = new Date(entry.startTime);
      }
      return startDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    // 作成時刻を表示
    if (entry.createdAt) {
      let createdDate: Date;
      if (typeof entry.createdAt === 'object' && '_seconds' in entry.createdAt) {
        createdDate = new Date(entry.createdAt._seconds * 1000);
      } else {
        createdDate = new Date(entry.createdAt);
      }
      return createdDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    return '-';
  };

  // タイマーの経過時間を計算
  const getElapsedTime = (startTime: string | Date | { _seconds: number; _nanoseconds: number }) => {
    let start: Date;
    
    if (typeof startTime === 'string') {
      start = new Date(startTime);
    } else if (startTime && typeof startTime === 'object' && '_seconds' in startTime) {
      // Firestore Timestamp format
      start = new Date(startTime._seconds * 1000);
    } else {
      start = new Date(startTime);
    }
    
    const now = currentTime;
    const diffMs = now.getTime() - start.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    return diffSeconds;
  };

  // Filter time entries for today
  const getTodayEntries = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = timeEntries.filter(entry => {
      let entryDate: string;
      
      if (typeof entry.date === 'string') {
        // If it's already a string date, use it directly or parse if needed
        entryDate = entry.date.includes('T') ? entry.date.split('T')[0] : entry.date;
      } else if (entry.date && typeof entry.date === 'object' && '_seconds' in entry.date) {
        // Firestore timestamp format
        entryDate = new Date(entry.date._seconds * 1000).toISOString().split('T')[0];
      } else {
        // Other date formats or invalid dates
        return false;
      }
      
      return entryDate === today;
    });
    
    // Sort by creation time (newest first)
    return todayEntries.sort((a, b) => {
      const getTime = (entry: TimeEntry) => {
        if (entry.startTime) {
          if (typeof entry.startTime === 'object' && '_seconds' in entry.startTime) {
            return entry.startTime._seconds * 1000;
          }
          return new Date(entry.startTime).getTime();
        }
        if (entry.createdAt) {
          if (typeof entry.createdAt === 'object' && '_seconds' in entry.createdAt) {
            return entry.createdAt._seconds * 1000;
          }
          return new Date(entry.createdAt).getTime();
        }
        return 0;
      };
      
      return getTime(b) - getTime(a); // 新しい順（降順）
    });
  };

  // Filter time entries for the current week
  const getWeekEntries = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - dayOfWeek);
    firstDayOfWeek.setHours(0, 0, 0, 0);
    const lastDayOfWeek = new Date(today);
    lastDayOfWeek.setDate(today.getDate() - dayOfWeek + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999);

    return timeEntries.filter(entry => {
      let entryDate: Date;
      
      if (typeof entry.date === 'string') {
        entryDate = new Date(entry.date);
      } else if (entry.date && typeof entry.date === 'object' && '_seconds' in entry.date) {
        entryDate = new Date(entry.date._seconds * 1000);
      } else {
        return false;
      }
      
      // Check if date is valid
      if (isNaN(entryDate.getTime())) {
        return false;
      }
      
      entryDate.setHours(0, 0, 0, 0);
      return entryDate >= firstDayOfWeek && entryDate <= lastDayOfWeek;
    });
  };

  // Filter time entries for the current month
  const getMonthEntries = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);

    return timeEntries.filter(entry => {
      let entryDate: Date;
      
      if (typeof entry.date === 'string') {
        entryDate = new Date(entry.date);
      } else if (entry.date && typeof entry.date === 'object' && '_seconds' in entry.date) {
        entryDate = new Date(entry.date._seconds * 1000);
      } else {
        return false;
      }
      
      // Check if date is valid
      if (isNaN(entryDate.getTime())) {
        return false;
      }
      
      entryDate.setHours(0, 0, 0, 0);
      return entryDate >= firstDayOfMonth && entryDate <= lastDayOfMonth;
    });
  };

  // Save/Update Time Entry
  const handleSaveTimeEntry = async () => {
    
    if (!selectedProjectId || !selectedTaskId || !duration) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields (Project, Task, Duration)',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    // より堅牢な時間解析
    let totalSeconds = 0;
    if (duration.includes(':')) {
      const [hoursStr, minutesStr] = duration.split(':');
      const hours = parseInt(hoursStr) || 0;
      const minutes = parseInt(minutesStr) || 0;
      totalSeconds = (hours * 3600) + (minutes * 60);
    } else if (duration.includes('h') || duration.includes('m')) {
      // "1h 30m" 形式の解析
      const hourMatch = duration.match(/(\d+)h/);
      const minuteMatch = duration.match(/(\d+)m/);
      const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
      const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
      totalSeconds = (hours * 3600) + (minutes * 60);
    } else {
      // 数値のみの場合は分として扱う
      const minutes = parseFloat(duration) || 0;
      totalSeconds = minutes * 60;
    }
    
    // durationが0または無効な場合のチェック
    if (totalSeconds <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid duration greater than 0',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    const selectedProject = projects.find(p => (p._id || p.id) === selectedProjectId);
    const selectedTask = tasks.find(t => (t._id || t.id) === selectedTaskId);

    if (!selectedProject || !selectedTask) {
      toast({
        title: 'Error',
        description: 'Selected project or task not found.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    const timeEntryData = {
      userId: user?.id || '',
      projectId: selectedProject._id || selectedProject.id, // プロジェクトIDのみ送信
      task: selectedTask.name, // タスク名のみ送信
      date: date,
      hours: totalSeconds / 3600, // Convert seconds to hours for backend
      description: notes,
      isBillable: selectedTask.isBillable,
      isRunning: false,
    };

    try {
      if (selectedTimeEntry) {
        await updateTimeEntry(selectedTimeEntry._id || selectedTimeEntry.id, timeEntryData);
        // 更新後にリストを更新
        await fetchTimeEntries();
        toast({
          title: 'Success',
          description: 'Time entry updated successfully',
          status: 'success',
          duration: 2000,
          isClosable: true
        });
      } else {
        await addTimeEntry(timeEntryData);
        // 追加後にリストを更新
        await fetchTimeEntries();
        toast({
          title: 'Success',
          description: 'Time entry added successfully',
          status: 'success',
          duration: 2000,
          isClosable: true
        });
      }

      // フォームをリセット（プロジェクトとタスクは保持）
      setSelectedTimeEntry(null);
      setDuration('');
      setNotes('');
      // プロジェクトとタスクは選択状態を維持
      setDate(new Date().toISOString().split('T')[0]);

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save time entry',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // タイマーを開始
  const handleStartTimer = async () => {
    if (!selectedProjectId || !selectedTaskId) {
      toast({
        title: 'Error',
        description: 'Please select a project and task',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    try {
      const selectedTask = tasks.find(t => (t._id || t.id) === selectedTaskId);
      if (!selectedTask) {
        toast({
          title: 'Error',
          description: 'Selected task not found',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
        return;
      }
      await startTimer(selectedProjectId, selectedTask.name, notes, selectedTask.isBillable);
      toast({
        title: 'Timer Started',
        description: 'Your timer is now running',
        status: 'success',
        duration: 2000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start timer',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // タイマーを停止
  const handleStopTimer = async () => {
    try {
      const stoppedEntry = await stopTimer();
      if (stoppedEntry) {
        toast({
          title: 'Timer Stopped',
          description: `Recorded ${formatDuration(stoppedEntry.duration)}`,
          status: 'success',
          duration: 2000,
          isClosable: true
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to stop timer',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // 時間エントリーを削除
  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteTimeEntry(id);
      // 削除後にリストを更新
      await fetchTimeEntries();
      toast({
        title: 'Deleted',
        description: 'Time entry deleted successfully',
        status: 'success',
        duration: 2000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete time entry',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // 時間エントリーを編集
  const handleEditEntry = (entry: TimeEntry) => {
    setSelectedTimeEntry(entry);
  };

  // 編集をキャンセル
  const handleCancelEdit = () => {
    setSelectedTimeEntry(null);
    setDate(new Date().toISOString().split('T')[0]);
    // プロジェクトとタスクは保存された値に戻す
    setSelectedProjectId(localStorage.getItem('timeTracking_selectedProjectId') || '');
    setSelectedTaskId(localStorage.getItem('timeTracking_selectedTaskId') || '');
    setDuration('');
    setNotes('');
  };
  
  return (
    <Box>
      <Heading mb={6}>Time Tracking</Heading>
      
      <Card mb={5}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            {selectedTimeEntry && (
              <Box p={3} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200">
                <Flex justify="space-between" align="center">
                  <Text fontWeight="bold" color="blue.600">
                    Editing Time Entry: {selectedTimeEntry.project?.name || 'Unknown Project'} - {selectedTimeEntry.task}
                  </Text>
                  <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                    Cancel Edit
                  </Button>
                </Flex>
              </Box>
            )}
            <HStack spacing={4}>
              <FormControl>
                <FormLabel>Project</FormLabel>
                <Select 
                  placeholder="Select project"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  {projects.map(project => (
                    <option key={project._id || project.id} value={project._id || project.id}>{project.name}</option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Task</FormLabel>
                <Select 
                  placeholder="Select task"
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  isDisabled={!selectedProjectId} // プロジェクトが選択されていないとタスクは選択不可
                >
                  {tasks.map(task => (
                    <option key={task._id || task.id} value={task._id || task.id}>{task.name}</option>
                  ))}
                </Select>
              </FormControl>
            </HStack>
            
            <HStack spacing={4}>
              <FormControl>
                <FormLabel>Time</FormLabel>
                <Input 
                  type="text" 
                  placeholder="1:30 (1h 30m) or 90 (90 minutes)" 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={activeEntry !== null}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Format: "1:30" (hours:minutes) or "1h 30m" or "90" (minutes)
                </Text>
              </FormControl>
              
              <FormControl>
                <FormLabel>Date</FormLabel>
                <Input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={activeEntry !== null}
                />
              </FormControl>
            </HStack>
            
            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea 
                placeholder="Add notes about this time entry" 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </FormControl>
            
            <HStack spacing={4}>
              {activeEntry ? (
                <Button 
                  leftIcon={<MdStop />} 
                  colorScheme="red" 
                  onClick={handleStopTimer}
                >
                  Stop Timer
                </Button>
              ) : (
                <Button 
                  leftIcon={<MdPlayArrow />} 
                  colorScheme="green"
                  onClick={handleStartTimer}
                >
                  Start Timer
                </Button>
              )}
              
              <Button 
                colorScheme="blue"
                onClick={handleSaveTimeEntry}
                disabled={activeEntry !== null}
              >
                {selectedTimeEntry ? 'Update Entry' : 'Save Entry'}
              </Button>
            </HStack>
            
            {activeEntry && (
              <Box p={3} bg="green.50" borderRadius="md">
                <Flex justify="space-between" align="center">
                  <Box>
                    <Text fontWeight="bold">Timer Running</Text>
                    <Text>{activeEntry.projectName || activeEntry.project?.name || 'Unknown Project'} - {activeEntry.task}</Text>
                    <Text fontSize="sm" color="gray.600">{activeEntry.notes}</Text>
                    {activeEntry.startTime && (
                      <Text fontSize="lg" fontWeight="bold" color="green.600">
                        {formatDuration(getElapsedTime(activeEntry.startTime))}
                      </Text>
                    )}
                  </Box>
                  <Badge colorScheme="green" p={2} borderRadius="md">
                    Running
                  </Badge>
                </Flex>
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>
      
      <Tabs variant="enclosed" mb={8} index={tabIndex} onChange={(index) => {
        setTabIndex(index);
        setCurrentPage(1); // Reset page when switching tabs
      }}>
        <TabList>
          <Tab>Day</Tab>
          <Tab>Week</Tab>
          <Tab>Month</Tab>
          <Tab>All Entries</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            {isLoading ? (
              <Flex justify="center" p={10}>
                <Spinner />
              </Flex>
            ) : getTodayEntries().length > 0 ? (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Time</Th>
                    <Th>Project</Th>
                    <Th>Task</Th>
                    <Th>Notes</Th>
                    <Th>Duration</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {getTodayEntries().map(entry => (
                    <Tr key={entry._id || entry.id}>
                      <Td>{formatEntryTime(entry)}</Td>
                      <Td>{entry.project?.name || 'Unknown Project'}</Td>
                      <Td>{entry.task}</Td>
                      <Td>{entry.notes || '-'}</Td>
                      <Td>{entry.isRunning ? 'Running' : formatDuration(entry.duration || entry.hours, entry.hours !== undefined)}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Edit"
                            icon={<MdEdit />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditEntry(entry)}
                          />
                          <IconButton
                            aria-label="Delete"
                            icon={<MdDelete />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDeleteEntry(entry._id || entry.id)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <Text p={4}>No entries recorded today.</Text>
            )}
          </TabPanel>
          
          <TabPanel>
            {isLoading ? (
              <Flex justify="center" p={10}>
                <Spinner />
              </Flex>
            ) : getWeekEntries().length > 0 ? (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Project</Th>
                    <Th>Task</Th>
                    <Th>Notes</Th>
                    <Th>Duration</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {getWeekEntries().map(entry => (
                    <Tr key={entry._id || entry.id}>
                      <Td>{entry.date}</Td>
                      <Td>{entry.project?.name || 'Unknown Project'}</Td>
                      <Td>{entry.task}</Td>
                      <Td>{entry.notes || '-'}</Td>
                      <Td>{entry.isRunning ? 'Running' : formatDuration(entry.duration || entry.hours, entry.hours !== undefined)}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Edit"
                            icon={<MdEdit />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditEntry(entry)}
                          />
                          <IconButton
                            aria-label="Delete"
                            icon={<MdDelete />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDeleteEntry(entry._id || entry.id)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <Text p={4}>No entries recorded this week.</Text>
            )}
          </TabPanel>
          
          <TabPanel>
            {isLoading ? (
              <Flex justify="center" p={10}>
                <Spinner />
              </Flex>
            ) : getMonthEntries().length > 0 ? (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Project</Th>
                    <Th>Task</Th>
                    <Th>Notes</Th>
                    <Th>Duration</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {getMonthEntries().map(entry => (
                    <Tr key={entry._id || entry.id}>
                      <Td>{entry.date}</Td>
                      <Td>{entry.project?.name || 'Unknown Project'}</Td>
                      <Td>{entry.task}</Td>
                      <Td>{entry.notes || '-'}</Td>
                      <Td>{entry.isRunning ? 'Running' : formatDuration(entry.duration || entry.hours, entry.hours !== undefined)}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Edit"
                            icon={<MdEdit />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditEntry(entry)}
                          />
                          <IconButton
                            aria-label="Delete"
                            icon={<MdDelete />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDeleteEntry(entry._id || entry.id)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <Text p={4}>No entries recorded this month.</Text>
            )}
          </TabPanel>
          
          <TabPanel>
            {isLoading ? (
              <Flex justify="center" p={10}>
                <Spinner />
              </Flex>
            ) : timeEntries.length > 0 ? (
              <>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Project</Th>
                      <Th>Task</Th>
                      <Th>Notes</Th>
                      <Th>Duration</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {timeEntries
                      .sort((a, b) => {
                        const dateA = a.date && typeof a.date === 'object' && '_seconds' in a.date
                          ? new Date(a.date._seconds * 1000)
                          : new Date(a.date);
                        const dateB = b.date && typeof b.date === 'object' && '_seconds' in b.date
                          ? new Date(b.date._seconds * 1000)
                          : new Date(b.date);
                        return dateB.getTime() - dateA.getTime();
                      })
                      .slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage)
                      .map(entry => (
                      <Tr key={entry._id || entry.id}>
                        <Td>{entry.date}</Td>
                        <Td>{entry.project?.name || 'Unknown Project'}</Td>
                        <Td>{entry.task}</Td>
                        <Td>{entry.notes || '-'}</Td>
                        <Td>{entry.isRunning ? 'Running' : formatDuration(entry.duration || entry.hours, entry.hours !== undefined)}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="Edit"
                              icon={<MdEdit />}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditEntry(entry)}
                            />
                            <IconButton
                              aria-label="Delete"
                              icon={<MdDelete />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDeleteEntry(entry._id || entry.id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                
                {timeEntries.length > entriesPerPage && (
                  <Flex justify="center" mt={4}>
                    <ButtonGroup size="sm" spacing={2}>
                      <Button
                        onClick={() => setCurrentPage(1)}
                        isDisabled={currentPage === 1}
                      >
                        First
                      </Button>
                      <Button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        isDisabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Text alignSelf="center" px={4}>
                        Page {currentPage} of {Math.ceil(timeEntries.length / entriesPerPage)}
                      </Text>
                      <Button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        isDisabled={currentPage === Math.ceil(timeEntries.length / entriesPerPage)}
                      >
                        Next
                      </Button>
                      <Button
                        onClick={() => setCurrentPage(Math.ceil(timeEntries.length / entriesPerPage))}
                        isDisabled={currentPage === Math.ceil(timeEntries.length / entriesPerPage)}
                      >
                        Last
                      </Button>
                    </ButtonGroup>
                  </Flex>
                )}
              </>
            ) : (
              <Text p={4}>No time entries recorded.</Text>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default TimeTracking;