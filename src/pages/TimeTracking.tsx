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
import { useTimeEntries, TimePeriod } from '../contexts/TimeEntryContext';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext'; // useAuthをインポート
import { TimeEntry, Task } from '../types'; // ProjectとTaskをインポート
import { formatTime } from '../utils/timeFormat';

// タブインデックスとTimePeriodのマッピング
const TAB_TO_PERIOD: TimePeriod[] = ['day', 'week', 'month', 'all'];

// タイムゾーンの影響を受けずにJSTで今日の日付を取得
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TimeTracking = () => {
  const { projects } = useProjects();
  const { user } = useAuth();
  const [date, setDate] = useState<string>(getTodayDateString());
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
    fetchTimeEntriesByPeriod,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    startTimer,
    stopTimer,
    resumeTimer,
    activeEntry,
    currentPeriod
  } = useTimeEntries();

  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find(p => (p._id || p.id) === selectedProjectId);
      if (project) {
        const projectTasks = project.tasks || [];
        setTasks(projectTasks);

        // プロジェクト切替時に1つ目のタスクを自動選択（編集モードでない場合のみ）
        // タスクが空で、かつタスクが存在する場合に自動選択
        if (!selectedTimeEntry && projectTasks.length > 0 && !selectedTaskId) {
          const firstTask = projectTasks[0];
          setSelectedTaskId(firstTask._id || firstTask.id || firstTask.name);
        }
      } else {
        setTasks([]);
        setSelectedTaskId('');
      }
    } else {
      setTasks([]);
      setSelectedTaskId('');
    }
  }, [selectedProjectId, projects, selectedTimeEntry, selectedTaskId]);

  // タブインデックスとcurrentPeriodを同期
  useEffect(() => {
    const periodIndex = TAB_TO_PERIOD.indexOf(currentPeriod);
    if (periodIndex !== -1 && periodIndex !== tabIndex) {
      setTabIndex(periodIndex);
    }
  }, [currentPeriod, tabIndex]);

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
    let interval: ReturnType<typeof setInterval>;
    
    if (activeEntry && activeEntry.isRunning) {
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
      
      // プロジェクトIDを設定 (projectIdフィールドを直接使用)
      const projectId = selectedTimeEntry.projectId || selectedTimeEntry.project?._id || selectedTimeEntry.project?.id;
      if (projectId) {
        setSelectedProjectId(projectId);
        
        // プロジェクトが設定されたら、そのプロジェクトのタスクを取得
        const project = projects.find(p => (p._id || p.id) === projectId);
        if (project && project.tasks) {
          // まずタスクリストを更新
          setTasks(project.tasks);
          
          // タスク名からタスクIDを見つける
          const taskName = typeof selectedTimeEntry.task === 'string' ? selectedTimeEntry.task : selectedTimeEntry.task?.name;
          const task = project.tasks.find(t => t.name === taskName);
          if (task) {
            // タスクIDを少し遅延して設定（タスクリストの更新後）
            setTimeout(() => {
              setSelectedTaskId(task._id || task.id || task.name);
            }, 100);
          } else {
            setSelectedTaskId('');
          }
        } else {
          setTasks([]);
          setSelectedTaskId('');
        }
      } else {
        setSelectedProjectId('');
        setTasks([]);
        setSelectedTaskId('');
      }
      
      // hoursフィールドを優先的に使用（より信頼できる値）
      console.log('Setting duration for edit:', {
        duration: selectedTimeEntry.duration, 
        hours: selectedTimeEntry.hours,
        entireEntry: selectedTimeEntry
      });
      
      // hoursを優先的に使用（手動入力された正確な値）
      if (selectedTimeEntry.hours !== undefined && selectedTimeEntry.hours !== null && selectedTimeEntry.hours > 0) {
        const formatted = formatTime(selectedTimeEntry.hours * 3600);
        console.log('Using hours:', selectedTimeEntry.hours, '-> formatted:', formatted);
        setDuration(formatted);
      } else if (selectedTimeEntry.duration !== undefined && selectedTimeEntry.duration !== null && selectedTimeEntry.duration > 0) {
        const formatted = formatTime(selectedTimeEntry.duration);
        console.log('Using duration (seconds):', selectedTimeEntry.duration, '-> formatted:', formatted);
        setDuration(formatted);
      } else {
        console.log('No duration or hours found, setting to 0h 0m');
        setDuration(formatTime(0));
      }
      setNotes(selectedTimeEntry.notes || selectedTimeEntry.description || '');
    }
  }, [selectedTimeEntry, projects]);



  // タイマーの経過時間を計算（リアルタイム更新対応）
  const getElapsedTime = (startTime: string | Date | undefined, baseDuration: number = 0) => {
    if (!startTime) return baseDuration;
    
    let start: Date;
    
    if (typeof startTime === 'string') {
      start = new Date(startTime);
    } else if (startTime instanceof Date) {
      start = startTime;
    } else {
      return baseDuration;
    }
    
    // currentTimeを使用してリアルタイムに更新
    const now = currentTime;
    const diffMs = now.getTime() - start.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    // Add base duration to current session time
    return baseDuration + diffSeconds;
  };

  // Filter time entries for today
  const getTodayEntries = () => {
    const today = getTodayDateString();
    const todayEntries = timeEntries.filter(entry => {
      let entryDate: string;
      
      if (typeof entry.date === 'string') {
        // If it's already a string date, use it directly or parse if needed
        entryDate = entry.date.includes('T') ? entry.date.split('T')[0] : entry.date;
      } else if (entry.date && false) {
        // Firestore timestamp format
        entryDate = new Date(entry.date).toISOString().split('T')[0];
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
          return new Date(entry.startTime).getTime();
        }
        if (entry.createdAt) {
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
      } else if (entry.date && false) {
        entryDate = new Date(entry.date);
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
      } else if (entry.date && false) {
        entryDate = new Date(entry.date);
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

  // Calculate total duration for entries
  const calculateTotalDuration = (entries: TimeEntry[]) => {
    const totalSeconds = entries.reduce((total, entry) => {
      if (entry.isRunning && entry.startTime) {
        return total + getElapsedTime(entry.startTime, entry.duration || 0);
      }
      // Use hours field if available, otherwise use duration
      if (entry.hours !== undefined && entry.hours !== null && entry.hours > 0) {
        return total + (entry.hours * 3600);
      }
      return total + (entry.duration || 0);
    }, 0);

    return formatTime(totalSeconds);
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
      duration: totalSeconds, // Send duration in seconds
      hours: totalSeconds / 3600, // Also send hours for consistency
      notes: notes, // Use 'notes' field instead of 'description'
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
      setDate(getTodayDateString());

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

  // タイマーを開始（既存記録の再開にも対応）
  const handleStartTimer = async () => {
    // 編集中の既存記録がある場合は、その記録のタイマーを再開
    if (selectedTimeEntry && selectedTimeEntry.id) {
      try {
        // 既存記録のタイマーを再開（同じエントリーを使用）
        await resumeTimer(selectedTimeEntry.id);
        toast({
          title: 'Timer Resumed',
          description: 'Your timer has been resumed for the selected entry',
          status: 'success',
          duration: 2000,
          isClosable: true
        });
        
        // 編集モードをリセット
        setSelectedTimeEntry(null);
        return;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to resume timer',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
        return;
      }
    }
    
    // 新規タイマーの開始（既存の処理）
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
          description: `Recorded ${formatTime(stoppedEntry.duration)}`,
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
    setDate(getTodayDateString());
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
                    Editing Time Entry: {selectedTimeEntry.projectName || selectedTimeEntry.project?.name || 'Unknown Project'} - {typeof selectedTimeEntry.task === 'string' ? selectedTimeEntry.task : selectedTimeEntry.task?.name}
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
                  onChange={(e) => {
                    const newProjectId = e.target.value;
                    setSelectedProjectId(newProjectId);
                    // プロジェクトが変更されたらタスクをリセット（編集時以外）
                    if (!selectedTimeEntry) {
                      setSelectedTaskId('');
                    }
                  }}
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
                  value={selectedTaskId || ''}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  isDisabled={!selectedProjectId || tasks.length === 0} // プロジェクトが選択されていないか、タスクがない場合は選択不可
                >
                  {tasks.map(task => {
                    const taskId = task._id || task.id || task.name;
                    return (
                      <option key={taskId} value={taskId}>{task.name}</option>
                    );
                  })}
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
                  max={getTodayDateString()}
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
            
            {selectedTimeEntry && !activeEntry && (
              <Text fontSize="sm" color="blue.600" mb={2}>
                📝 Editing existing entry - Click "Resume Timer" to restart the timer for this entry
              </Text>
            )}
            
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
                  {selectedTimeEntry ? 'Resume Timer' : 'Start Timer'}
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
                    <Text>{activeEntry.projectName || activeEntry.project?.name || 'Unknown Project'} - {typeof activeEntry.task === 'string' ? activeEntry.task : activeEntry.task?.name}</Text>
                    <Text fontSize="sm" color="gray.600">{activeEntry.notes}</Text>
                    {activeEntry.startTime && (
                      <Text fontSize="lg" fontWeight="bold" color="green.600">
                        {formatTime(getElapsedTime(activeEntry.startTime, activeEntry.duration || 0))}
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
        // タブ切り替え時に該当期間のデータを取得
        const period = TAB_TO_PERIOD[index];
        if (period) {
          fetchTimeEntriesByPeriod(period);
        }
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
                    {getTodayEntries().map(entry => (
                      <Tr key={entry._id || entry.id}>
                        <Td>{entry.date}</Td>
                        <Td>{entry.project?.name || entry.projectName || 'Unknown Project'}</Td>
                        <Td>{typeof entry.task === 'string' ? entry.task : entry.task?.name}</Td>
                        <Td>{entry.notes || entry.description || '-'}</Td>
                        <Td>{entry.isRunning ? formatTime(getElapsedTime(entry.startTime, entry.duration || 0)) : (entry.hours !== undefined && entry.hours !== null && entry.hours > 0 ? formatTime(entry.hours * 3600) : formatTime(entry.duration || 0))}</Td>
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
                <Box mt={4} p={4} bg="gray.50" borderRadius="md">
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" fontSize="lg">Total:</Text>
                    <Text fontWeight="bold" fontSize="lg" color="blue.600">
                      {calculateTotalDuration(getTodayEntries())}
                    </Text>
                  </Flex>
                </Box>
              </>
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
                    {getWeekEntries().map(entry => (
                      <Tr key={entry._id || entry.id}>
                        <Td>{entry.date}</Td>
                        <Td>{entry.project?.name || entry.projectName || 'Unknown Project'}</Td>
                        <Td>{typeof entry.task === 'string' ? entry.task : entry.task?.name}</Td>
                        <Td>{entry.notes || entry.description || '-'}</Td>
                        <Td>{entry.isRunning ? formatTime(getElapsedTime(entry.startTime, entry.duration || 0)) : (entry.hours !== undefined && entry.hours !== null && entry.hours > 0 ? formatTime(entry.hours * 3600) : formatTime(entry.duration || 0))}</Td>
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
                <Box mt={4} p={4} bg="gray.50" borderRadius="md">
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" fontSize="lg">Total:</Text>
                    <Text fontWeight="bold" fontSize="lg" color="blue.600">
                      {calculateTotalDuration(getWeekEntries())}
                    </Text>
                  </Flex>
                </Box>
              </>
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
                    {getMonthEntries().map(entry => (
                      <Tr key={entry._id || entry.id}>
                        <Td>{entry.date}</Td>
                        <Td>{entry.project?.name || entry.projectName || 'Unknown Project'}</Td>
                        <Td>{typeof entry.task === 'string' ? entry.task : entry.task?.name}</Td>
                        <Td>{entry.notes || entry.description || '-'}</Td>
                        <Td>{entry.isRunning ? formatTime(getElapsedTime(entry.startTime, entry.duration || 0)) : (entry.hours !== undefined && entry.hours !== null && entry.hours > 0 ? formatTime(entry.hours * 3600) : formatTime(entry.duration || 0))}</Td>
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
                <Box mt={4} p={4} bg="gray.50" borderRadius="md">
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" fontSize="lg">Total:</Text>
                    <Text fontWeight="bold" fontSize="lg" color="blue.600">
                      {calculateTotalDuration(getMonthEntries())}
                    </Text>
                  </Flex>
                </Box>
              </>
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
                        const dateA = new Date(a.date);
                        const dateB = new Date(b.date);
                        return dateB.getTime() - dateA.getTime();
                      })
                      .slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage)
                      .map(entry => (
                      <Tr key={entry._id || entry.id}>
                        <Td>{entry.date}</Td>
                        <Td>{entry.project?.name || entry.projectName || 'Unknown Project'}</Td>
                        <Td>{typeof entry.task === 'string' ? entry.task : entry.task?.name}</Td>
                        <Td>{entry.notes || '-'}</Td>
                        <Td>{entry.isRunning ? 'Running' : (entry.hours !== undefined && entry.hours !== null && entry.hours > 0 ? formatTime(entry.hours * 3600) : formatTime(entry.duration || 0))}</Td>
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