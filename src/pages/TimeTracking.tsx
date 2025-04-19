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
  Flex
} from '@chakra-ui/react';
import { MdEdit, MdDelete, MdPlayArrow, MdStop } from 'react-icons/md';
import { useTimeEntries } from '../contexts/TimeEntryContext';
import { useProjects } from '../contexts/ProjectContext';

const TimeTracking = () => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [tabIndex, setTabIndex] = useState<number>(0);
  
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
  
  const { projects, fetchProjects } = useProjects();
  
  // モックタスクデータ
  const tasks = [
    { id: '1', name: 'Design' },
    { id: '2', name: 'Development' },
    { id: '3', name: 'Meeting' },
    { id: '4', name: 'Research' }
  ];
  
  useEffect(() => {
    fetchTimeEntries();
    fetchProjects();
  }, []);
  
  // 現在の日付データのみをフィルタリング
  const getTodayEntries = () => {
    const today = new Date().toISOString().split('T')[0];
    return timeEntries.filter(entry => entry.date === today);
  };
  
  // 今週のデータをフィルタリング
  const getWeekEntries = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // 週の始まり（日曜日）
    
    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startOfWeek;
    });
  };
  
  // 今月のデータをフィルタリング
  const getMonthEntries = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startOfMonth;
    });
  };
  
  // プロジェクト名を取得
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };
  
  // タスク名を取得
  const getTaskName = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task ? task.name : 'Unknown Task';
  };
  
  // 時間をフォーマット
  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
  };
  
  // 新しい時間エントリーを追加
  const handleAddTimeEntry = async () => {
    if (!selectedProjectId || !selectedTaskId || !duration) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    // 時間形式を数値に変換 (例: "1:30" → 1.5)
    let durationValue = 0;
    if (duration.includes(':')) {
      const [hours, minutes] = duration.split(':');
      durationValue = parseInt(hours) + parseInt(minutes) / 60;
    } else {
      durationValue = parseFloat(duration);
    }
    
    try {
      await addTimeEntry({
        userId: '1', // 現在のユーザーID
        projectId: selectedProjectId,
        taskId: selectedTaskId,
        date,
        duration: durationValue,
        notes,
        isBillable: true,
        isRunning: false,
        startTime: undefined,
        endTime: undefined
      });
      
      // フォームをリセット
      setDuration('');
      setNotes('');
      
      toast({
        title: 'Success',
        description: 'Time entry added successfully',
        status: 'success',
        duration: 2000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add time entry',
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
      await startTimer(selectedProjectId, selectedTaskId, notes);
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
          description: `Recorded ${formatDuration(stoppedEntry.duration)} hours`,
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
  
  return (
    <Box>
      <Heading mb={6}>Time Tracking</Heading>
      
      <Card mb={5}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack spacing={4}>
              <FormControl>
                <FormLabel>Project</FormLabel>
                <Select 
                  placeholder="Select project"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Task</FormLabel>
                <Select 
                  placeholder="Select task"
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                >
                  {tasks.map(task => (
                    <option key={task.id} value={task.id}>{task.name}</option>
                  ))}
                </Select>
              </FormControl>
            </HStack>
            
            <HStack spacing={4}>
              <FormControl>
                <FormLabel>Time</FormLabel>
                <Input 
                  type="text" 
                  placeholder="0:00" 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={activeEntry !== null}
                />
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
                onClick={handleAddTimeEntry}
                disabled={activeEntry !== null}
              >
                Save Entry
              </Button>
            </HStack>
            
            {activeEntry && (
              <Box p={3} bg="green.50" borderRadius="md">
                <Flex justify="space-between" align="center">
                  <Box>
                    <Text fontWeight="bold">Timer Running</Text>
                    <Text>{getProjectName(activeEntry.projectId)} - {getTaskName(activeEntry.taskId)}</Text>
                    <Text fontSize="sm" color="gray.600">{activeEntry.notes}</Text>
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
      
      <Tabs variant="enclosed" mb={8} index={tabIndex} onChange={setTabIndex}>
        <TabList>
          <Tab>Day</Tab>
          <Tab>Week</Tab>
          <Tab>Month</Tab>
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
                    <Th>Project</Th>
                    <Th>Task</Th>
                    <Th>Notes</Th>
                    <Th>Duration</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {getTodayEntries().map(entry => (
                    <Tr key={entry.id}>
                      <Td>{getProjectName(entry.projectId)}</Td>
                      <Td>{getTaskName(entry.taskId)}</Td>
                      <Td>{entry.notes || '-'}</Td>
                      <Td>{entry.isRunning ? 'Running' : formatDuration(entry.duration)}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Edit"
                            icon={<MdEdit />}
                            size="sm"
                            variant="ghost"
                          />
                          <IconButton
                            aria-label="Delete"
                            icon={<MdDelete />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDeleteEntry(entry.id)}
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
                    <Tr key={entry.id}>
                      <Td>{entry.date}</Td>
                      <Td>{getProjectName(entry.projectId)}</Td>
                      <Td>{getTaskName(entry.taskId)}</Td>
                      <Td>{entry.notes || '-'}</Td>
                      <Td>{entry.isRunning ? 'Running' : formatDuration(entry.duration)}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Edit"
                            icon={<MdEdit />}
                            size="sm"
                            variant="ghost"
                          />
                          <IconButton
                            aria-label="Delete"
                            icon={<MdDelete />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDeleteEntry(entry.id)}
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
                    <Tr key={entry.id}>
                      <Td>{entry.date}</Td>
                      <Td>{getProjectName(entry.projectId)}</Td>
                      <Td>{getTaskName(entry.taskId)}</Td>
                      <Td>{entry.notes || '-'}</Td>
                      <Td>{entry.isRunning ? 'Running' : formatDuration(entry.duration)}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Edit"
                            icon={<MdEdit />}
                            size="sm"
                            variant="ghost"
                          />
                          <IconButton
                            aria-label="Delete"
                            icon={<MdDelete />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDeleteEntry(entry.id)}
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
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default TimeTracking;