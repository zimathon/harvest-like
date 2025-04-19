import { Box, VStack, Text, Flex, Icon, Button, Divider, Avatar } from '@chakra-ui/react'
import { NavLink as RouterLink, useNavigate } from 'react-router-dom'
import { 
  MdTimer, 
  MdAttachMoney, 
  MdFolderOpen, 
  MdPeople, 
  MdBarChart, 
  MdReceipt, 
  MdSettings,
  MdLogout,
  MdDashboard
} from 'react-icons/md'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { name: 'Dashboard', path: '/', icon: MdDashboard },
  { name: 'Time', path: '/time', icon: MdTimer },
  { name: 'Expenses', path: '/expenses', icon: MdAttachMoney },
  { name: 'Projects', path: '/projects', icon: MdFolderOpen },
  { name: 'Team', path: '/team', icon: MdPeople },
  { name: 'Reports', path: '/reports', icon: MdBarChart },
  { name: 'Invoices', path: '/invoices', icon: MdReceipt },
  { name: 'Manage', path: '/manage', icon: MdSettings }
]

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box
      w="240px"
      h="100vh"
      bg="gray.800"
      color="white"
      py={6}
      px={4}
      boxShadow="lg"
      display="flex"
      flexDirection="column"
    >
      <Flex justifyContent="center" mb={8}>
        <Text fontSize="2xl" fontWeight="bold">Harvest-like</Text>
      </Flex>
      
      <VStack spacing={1} align="stretch" flex="1">
        {navItems.map((item) => (
          <Box
            key={item.name}
            as={RouterLink}
            to={item.path}
            p={3}
            borderRadius="md"
            _hover={{ bg: 'gray.700' }}
            style={({ isActive }: { isActive: boolean }) => ({
              backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : ''
            })}
          >
            <Flex align="center">
              <Icon as={item.icon} mr={3} boxSize={5} />
              <Text>{item.name}</Text>
            </Flex>
          </Box>
        ))}
      </VStack>
      
      {user && (
        <Box mt="auto">
          <Divider my={4} borderColor="gray.600" />
          
          <Flex align="center" mb={4}>
            <Avatar size="sm" name={user.name} mr={3} />
            <Box>
              <Text fontWeight="medium">{user.name}</Text>
              <Text fontSize="xs" color="gray.300">{user.role}</Text>
            </Box>
          </Flex>
          
          <Button 
            leftIcon={<MdLogout />} 
            variant="outline" 
            colorScheme="whiteAlpha" 
            size="sm"
            width="full"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default Sidebar