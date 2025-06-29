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
import { useAuth } from '../contexts/AuthContext'; // useAuthをインポート
import { TimeEntry, Task } from '../types'; // ProjectとTaskをインポート

const TimeTracking = () => {
  const { projects } = useProjects();
  const { user } = useAuth();
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [selectedTimeEntry, setSelectedTimeEntry] = useState<TimeEntry | null>(null); // 編集用
  
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
      const project = projects.find(p => p.id === selectedProjectId);
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

  useEffect(() => {
    if (selectedTimeEntry) {
      setDate(selectedTimeEntry.date);
      setSelectedProjectId(selectedTimeEntry.project.id);
      setSelectedTaskId(selectedTimeEntry.task.id || '');
      setDuration(formatDuration(selectedTimeEntry.duration));
      setNotes(selectedTimeEntry.notes || '');
    }
  }, [selectedTimeEntry]);

      // Helper function to format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Filter time entries for today
  const getTodayEntries = () => {
    const today = new Date().toISOString().split('T')[0];
    return timeEntries.filter(entry => entry.date === today);
  };

  // Filter time entries for the current week
  const getWeekEntries = () => {
    const today = new Date();
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= firstDayOfWeek && entryDate <= lastDayOfWeek;
    });
  };

  // Filter time entries for the current month
  const getMonthEntries = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
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

    const [hours, minutes] = duration.split(':').map(Number);
    const totalSeconds = (hours * 3600) + (minutes * 60);

    const selectedProject = projects.find(p => p.id === selectedProjectId);
    const selectedTask = tasks.find(t => t.id === selectedTaskId);

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
      project: selectedProject,
      task: selectedTask,
      date: date,
      duration: totalSeconds,
      notes: notes,
      isBillable: selectedTask.isBillable,
      isRunning: false,
    };

    try {
      if (selectedTimeEntry) {
        await updateTimeEntry(selectedTimeEntry.id, timeEntryData);
        toast({
          title: 'Success',
          description: 'Time entry updated successfully',
          status: 'success',
          duration: 2000,
          isClosable: true
        });
      } else {
        await addTimeEntry(timeEntryData);
        toast({
          title: 'Success',
          description: 'Time entry added successfully',
          status: 'success',
          duration: 2000,
          isClosable: true
        });
      }

      // フォームをリセット
      setSelectedTimeEntry(null);
      setDuration('');
      setNotes('');
      setSelectedProjectId('');
      setSelectedTaskId('');
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

  // 時間エントリーを編集
  const handleEditEntry = (entry: TimeEntry) => {
    setSelectedTimeEntry(entry);
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
                  isDisabled={!selectedProjectId} // プロジェクトが選択されていないとタスクは選択不可
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
                    <Text>{activeEntry.project.name} - {activeEntry.task.name}</Text>
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
                      <Td>{entry.project.name}</Td>
                      <Td>{entry.task.name}</Td>
                      <Td>{entry.notes || '-'}</Td>
                      <Td>{entry.isRunning ? 'Running' : formatDuration(entry.duration)}</Td>
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
                      <Td>{entry.project.name}</Td>
                      <Td>{entry.task.name}</Td>
                      <Td>{entry.notes || '-'}</Td>
                      <Td>{entry.isRunning ? 'Running' : formatDuration(entry.duration)}</Td>
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
                      <Td>{entry.project.name}</Td>
                      <Td>{entry.task.name}</Td>
                      <Td>{entry.notes || '-'}</Td>
                      <Td>{entry.isRunning ? 'Running' : formatDuration(entry.duration)}</Td>
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