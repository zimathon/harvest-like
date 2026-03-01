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
  ButtonGroup,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Grid,
  GridItem
} from '@chakra-ui/react';
import { MdEdit, MdDelete, MdPlayArrow, MdStop, MdChevronLeft, MdChevronRight, MdCalendarToday } from 'react-icons/md';
import { useTimeEntries, TimePeriod } from '../contexts/TimeEntryContext';
import { useProjects } from '../contexts/ProjectContext';
import { useClients } from '../contexts/ClientContext';
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

// 日付を表示用にフォーマット（例: "2月12日 (水)"）
const formatDateForDisplay = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00');
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日 (${weekday})`;
};

// 日付を1日進める/戻す
const adjustDate = (dateString: string, days: number): string => {
  const date = new Date(dateString + 'T00:00:00');
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// カレンダーコンポーネント
interface CalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onClose: () => void;
  maxDate?: string;
}

const Calendar = ({ selectedDate, onSelectDate, onClose, maxDate }: CalendarProps) => {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setViewDate(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setViewDate(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleSelectDay = (day: number) => {
    const year = viewDate.year;
    const month = String(viewDate.month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const newDate = `${year}-${month}-${dayStr}`;

    // maxDate チェック
    if (maxDate && newDate > maxDate) {
      return;
    }

    onSelectDate(newDate);
    onClose();
  };

  const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
  const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month);
  const days: (number | null)[] = [];

  // 月初めの空白セルを追加
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // 日付セルを追加
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // 選択中の日付を解析
  const selectedParts = selectedDate.split('-');
  const selectedYear = parseInt(selectedParts[0]);
  const selectedMonth = parseInt(selectedParts[1]) - 1;
  const selectedDay = parseInt(selectedParts[2]);

  // 今日の日付
  const todayStr = getTodayDateString();
  const todayParts = todayStr.split('-');
  const todayYear = parseInt(todayParts[0]);
  const todayMonth = parseInt(todayParts[1]) - 1;
  const todayDay = parseInt(todayParts[2]);

  return (
    <Box p={2} minW="280px">
      {/* ヘッダー: 月表示と前後移動 */}
      <Flex justify="space-between" align="center" mb={3}>
        <IconButton
          aria-label="Previous month"
          icon={<MdChevronLeft />}
          size="sm"
          variant="ghost"
          onClick={handlePrevMonth}
        />
        <Text fontWeight="bold" fontSize="md">
          {viewDate.year}年 {monthNames[viewDate.month]}
        </Text>
        <IconButton
          aria-label="Next month"
          icon={<MdChevronRight />}
          size="sm"
          variant="ghost"
          onClick={handleNextMonth}
        />
      </Flex>

      {/* 曜日ヘッダー */}
      <Grid templateColumns="repeat(7, 1fr)" gap={1} mb={2}>
        {weekdays.map((day, index) => (
          <GridItem key={day} textAlign="center">
            <Text
              fontSize="xs"
              fontWeight="bold"
              color={index === 0 ? 'red.500' : index === 6 ? 'blue.500' : 'gray.600'}
            >
              {day}
            </Text>
          </GridItem>
        ))}
      </Grid>

      {/* 日付グリッド */}
      <Grid templateColumns="repeat(7, 1fr)" gap={1}>
        {days.map((day, index) => {
          if (day === null) {
            return <GridItem key={`empty-${index}`} />;
          }

          const isSelected = viewDate.year === selectedYear && viewDate.month === selectedMonth && day === selectedDay;
          const isToday = viewDate.year === todayYear && viewDate.month === todayMonth && day === todayDay;
          const dayOfWeek = (firstDay + day - 1) % 7;

          // maxDate チェック
          const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isDisabled = maxDate ? dateStr > maxDate : false;

          return (
            <GridItem key={day}>
              <Button
                size="sm"
                w="100%"
                h="32px"
                variant={isSelected ? 'solid' : 'ghost'}
                colorScheme={isSelected ? 'blue' : undefined}
                bg={isToday && !isSelected ? 'blue.50' : undefined}
                color={
                  isDisabled ? 'gray.300' :
                  isSelected ? 'white' :
                  dayOfWeek === 0 ? 'red.500' :
                  dayOfWeek === 6 ? 'blue.500' :
                  undefined
                }
                border={isToday ? '2px solid' : undefined}
                borderColor={isToday ? 'blue.300' : undefined}
                onClick={() => !isDisabled && handleSelectDay(day)}
                isDisabled={isDisabled}
                _hover={isDisabled ? {} : { bg: isSelected ? 'blue.600' : 'gray.100' }}
              >
                {day}
              </Button>
            </GridItem>
          );
        })}
      </Grid>

      {/* 今日ボタン */}
      <Flex justify="center" mt={3}>
        <Button
          size="sm"
          variant="outline"
          colorScheme="blue"
          onClick={() => {
            const today = getTodayDateString();
            onSelectDate(today);
            onClose();
          }}
        >
          今日
        </Button>
      </Flex>
    </Box>
  );
};

const TimeTracking = () => {
  const { projects } = useProjects();
  const { clients } = useClients();
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
  // フィルタ用のプロジェクトID（エントリ作成用とは別）
  const [filterProjectId, setFilterProjectId] = useState<string>(() => {
    return localStorage.getItem('timeTracking_filterProjectId') || '';
  });
  // フィルタ用のクライアントID
  const [filterClientId, setFilterClientId] = useState<string>(() => {
    return localStorage.getItem('timeTracking_filterClientId') || '';
  });
  
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

  // フィルタプロジェクトをlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('timeTracking_filterProjectId', filterProjectId);
  }, [filterProjectId]);

  // フィルタクライアントをlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('timeTracking_filterClientId', filterClientId);
  }, [filterClientId]);

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

  // プロジェクトでフィルタリング
  const filterByProject = (entries: TimeEntry[]) => {
    if (!filterProjectId) return entries;
    return entries.filter(entry => {
      const entryProjectId = entry.projectId || entry.project?._id || entry.project?.id;
      return entryProjectId === filterProjectId;
    });
  };

  // クライアントでフィルタリング
  const filterByClient = (entries: TimeEntry[]) => {
    if (!filterClientId) return entries;
    return entries.filter(entry => {
      // エントリーのプロジェクトIDを取得
      const entryProjectId = entry.projectId || entry.project?._id || entry.project?.id;
      if (!entryProjectId) return false;
      // プロジェクトを見つけてクライアントIDを確認
      const project = projects.find(p => (p._id || p.id) === entryProjectId);
      if (!project) return false;
      const projectClientId = project.clientId || (typeof project.client === 'string' ? project.client : project.client?._id || project.client?.id);
      return projectClientId === filterClientId;
    });
  };

  // 両方のフィルタを適用
  const applyFilters = (entries: TimeEntry[]) => {
    return filterByClient(filterByProject(entries));
  };

  // エントリーからプロジェクトコード付きの名前を取得
  const getProjectDisplayName = (entry: TimeEntry) => {
    const projectId = entry.projectId || entry.project?._id || entry.project?.id;
    const project = projects.find(p => (p._id || p.id) === projectId);
    const code = project?.code;
    const name = entry.project?.name || entry.projectName || 'Unknown Project';
    return code ? `[${code}] ${name}` : name;
  };

  // エントリーからタスクのサブコード付きの名前を取得
  const getTaskDisplayName = (entry: TimeEntry) => {
    const taskName = typeof entry.task === 'string' ? entry.task : entry.task?.name;
    const projectId = entry.projectId || entry.project?._id || entry.project?.id;
    const project = projects.find(p => (p._id || p.id) === projectId);
    const task = project?.tasks?.find(t => t.name === taskName);
    const subCode = task?.subCode;
    return subCode ? `[${subCode}] ${taskName || '-'}` : (taskName || '-');
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

    // プロジェクトフィルタを適用
    const filteredEntries = applyFilters(todayEntries);

    // Sort by creation time (newest first)
    return filteredEntries.sort((a, b) => {
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

    const weekEntries = timeEntries.filter(entry => {
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

    // フィルタを適用
    return applyFilters(weekEntries);
  };

  // Filter time entries for the current month
  const getMonthEntries = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);

    const monthEntries = timeEntries.filter(entry => {
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

    // フィルタを適用
    return applyFilters(monthEntries);
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
      // 数値のみの場合は時間として扱う
      const hours = parseFloat(duration) || 0;
      totalSeconds = hours * 3600;
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

      // フォームをリセット（プロジェクトとタスクと日付は保持）
      setSelectedTimeEntry(null);
      setDuration('');
      setNotes('');
      // プロジェクト、タスク、日付は選択状態を維持

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
    // 日付は現在選択している日付を維持
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
                    <option key={project._id || project.id} value={project._id || project.id}>
                      {project.code ? `[${project.code}] ` : ''}{project.name}
                    </option>
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
                      <option key={taskId} value={taskId}>
                        {task.subCode ? `[${task.subCode}] ` : ''}{task.name}
                      </option>
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
                  placeholder="1:30 or 1h 30m or 1.5 (hours)"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={activeEntry !== null}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Format: "1:30" (hours:minutes) or "1h 30m" or "1.5" (hours)
                </Text>
              </FormControl>
              
              <FormControl>
                <FormLabel>Date</FormLabel>
                <HStack spacing={2}>
                  <IconButton
                    aria-label="Previous day"
                    icon={<MdChevronLeft />}
                    size="md"
                    variant="outline"
                    onClick={() => setDate(adjustDate(date, -1))}
                    isDisabled={activeEntry !== null}
                  />
                  <Popover placement="bottom-start">
                    {({ onClose }) => (
                      <>
                        <PopoverTrigger>
                          <Button
                            variant="outline"
                            leftIcon={<MdCalendarToday />}
                            minW="160px"
                            justifyContent="flex-start"
                            fontWeight="normal"
                            isDisabled={activeEntry !== null}
                          >
                            {formatDateForDisplay(date)}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent w="auto">
                          <PopoverBody p={0}>
                            <Calendar
                              selectedDate={date}
                              onSelectDate={setDate}
                              onClose={onClose}
                              maxDate={getTodayDateString()}
                            />
                          </PopoverBody>
                        </PopoverContent>
                      </>
                    )}
                  </Popover>
                  <IconButton
                    aria-label="Next day"
                    icon={<MdChevronRight />}
                    size="md"
                    variant="outline"
                    onClick={() => {
                      const newDate = adjustDate(date, 1);
                      if (newDate <= getTodayDateString()) {
                        setDate(newDate);
                      }
                    }}
                    isDisabled={activeEntry !== null || date >= getTodayDateString()}
                  />
                </HStack>
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

      {/* フィルタ */}
      <Flex mb={4} align="center" justify="space-between" wrap="wrap" gap={4}>
        <HStack spacing={4} wrap="wrap">
          <HStack spacing={2}>
            <Text fontWeight="medium">Client:</Text>
            <Select
              placeholder="All Clients"
              value={filterClientId}
              onChange={(e) => {
                setFilterClientId(e.target.value);
                setCurrentPage(1); // フィルタ変更時にページをリセット
              }}
              w="200px"
            >
              {clients.map(client => (
                <option key={client._id || client.id} value={client._id || client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </HStack>
          <HStack spacing={2}>
            <Text fontWeight="medium">Project:</Text>
            <Select
              placeholder="All Projects"
              value={filterProjectId}
              onChange={(e) => {
                setFilterProjectId(e.target.value);
                setCurrentPage(1); // フィルタ変更時にページをリセット
              }}
              w="200px"
            >
              {projects.map(project => (
                <option key={project._id || project.id} value={project._id || project.id}>
                  {project.code ? `[${project.code}] ` : ''}{project.name}
                </option>
              ))}
            </Select>
          </HStack>
          {(filterProjectId || filterClientId) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setFilterProjectId('');
                setFilterClientId('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </HStack>
      </Flex>

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
                        <Td>{getProjectDisplayName(entry)}</Td>
                        <Td>{getTaskDisplayName(entry)}</Td>
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
              <Text p={4}>{(filterProjectId || filterClientId) ? 'No entries found for the selected filter today.' : 'No entries recorded today.'}</Text>
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
                        <Td>{getProjectDisplayName(entry)}</Td>
                        <Td>{getTaskDisplayName(entry)}</Td>
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
              <Text p={4}>{(filterProjectId || filterClientId) ? 'No entries found for the selected filter this week.' : 'No entries recorded this week.'}</Text>
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
                        <Td>{getProjectDisplayName(entry)}</Td>
                        <Td>{getTaskDisplayName(entry)}</Td>
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
              <Text p={4}>{(filterProjectId || filterClientId) ? 'No entries found for the selected filter this month.' : 'No entries recorded this month.'}</Text>
            )}
          </TabPanel>
          
          <TabPanel>
            {(() => {
              const filteredAllEntries = applyFilters(timeEntries);
              const sortedEntries = filteredAllEntries.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB.getTime() - dateA.getTime();
              });
              const totalPages = Math.ceil(sortedEntries.length / entriesPerPage);
              const paginatedEntries = sortedEntries.slice(
                (currentPage - 1) * entriesPerPage,
                currentPage * entriesPerPage
              );

              return isLoading ? (
                <Flex justify="center" p={10}>
                  <Spinner />
                </Flex>
              ) : sortedEntries.length > 0 ? (
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
                      {paginatedEntries.map(entry => (
                        <Tr key={entry._id || entry.id}>
                          <Td>{entry.date}</Td>
                          <Td>{getProjectDisplayName(entry)}</Td>
                          <Td>{getTaskDisplayName(entry)}</Td>
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

                  {sortedEntries.length > entriesPerPage && (
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
                          Page {currentPage} of {totalPages}
                        </Text>
                        <Button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          isDisabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                        <Button
                          onClick={() => setCurrentPage(totalPages)}
                          isDisabled={currentPage === totalPages}
                        >
                          Last
                        </Button>
                      </ButtonGroup>
                    </Flex>
                  )}
                </>
              ) : (
                <Text p={4}>{(filterProjectId || filterClientId) ? 'No entries found for the selected filter.' : 'No time entries recorded.'}</Text>
              );
            })()}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default TimeTracking;