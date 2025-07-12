import {
  Box,
  Heading,
  VStack,
  HStack,
  Button,
  Select,
  Grid,
  GridItem,
  Card,
  CardBody,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  FormControl,
  FormLabel,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react'
import { useProjects } from '../contexts/ProjectContext'
import { useUsers } from '../contexts/UserContext'

const Reports = () => {
  const { projects, isLoading: projectsLoading, error: projectsError } = useProjects();
  const { users, isLoading: usersLoading, error: usersError } = useUsers();

  if (projectsLoading || usersLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (projectsError || usersError) {
    return (
      <Alert status="error">
        <AlertIcon />
        Error loading data: {projectsError || usersError}
      </Alert>
    );
  }

  return (
    <Box>
      <Heading mb={6}>Reports</Heading>
      
      <VStack spacing={6} align="stretch">
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Report Parameters</Heading>
            <Grid templateColumns="repeat(3, 1fr)" gap={4}>
              <GridItem>
                <FormControl>
                  <FormLabel>Date Range</FormLabel>
                  <Select defaultValue="thisMonth">
                    <option value="today">Today</option>
                    <option value="thisWeek">This Week</option>
                    <option value="lastWeek">Last Week</option>
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="custom">Custom Range</option>
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl>
                  <FormLabel>Project</FormLabel>
                  <Select defaultValue="all">
                    <option value="all">All Projects</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl>
                  <FormLabel>Team Member</FormLabel>
                  <Select defaultValue="all">
                    <option value="all">All Team Members</option>
                    {Array.isArray(users) && users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
            </Grid>
            
            <HStack mt={6}>
              <Button colorScheme="blue">Generate Report</Button>
              <Button variant="outline">Export</Button>
            </HStack>
          </CardBody>
        </Card>
        
        <Tabs variant="enclosed">
          <TabList>
            <Tab>Time Summary</Tab>
            <Tab>Project Summary</Tab>
            <Tab>Team Summary</Tab>
            <Tab>Expenses</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Time Summary for April 2025</Heading>
                    <Text>No data available. Please generate a report using the parameters above.</Text>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
            
            <TabPanel>
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Project Summary for April 2025</Heading>
                    <Text>No data available. Please generate a report using the parameters above.</Text>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
            
            <TabPanel>
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Team Summary for April 2025</Heading>
                    <Text>No data available. Please generate a report using the parameters above.</Text>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
            
            <TabPanel>
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Expenses Summary for April 2025</Heading>
                    <Text>No data available. Please generate a report using the parameters above.</Text>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  )
}

export default Reports