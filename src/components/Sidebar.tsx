import { Avatar, Box, Button, Divider, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerOverlay, Flex, Icon, IconButton, Text, VStack, useDisclosure } from '@chakra-ui/react'
import {
  MdAttachMoney,
  MdBarChart,
  MdBusiness,
  MdDashboard,
  MdFolderOpen,
  MdLogout,
  MdMenu,
  MdPeople,
  MdReceipt,
  MdSettings,
  MdTimer
} from 'react-icons/md'
import { NavLink as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { name: 'Dashboard', path: '/', icon: MdDashboard },
  { name: 'Time', path: '/time', icon: MdTimer },
  { name: 'Expenses', path: '/expenses', icon: MdAttachMoney },
  { name: 'Projects', path: '/projects', icon: MdFolderOpen },
  { name: 'Clients', path: '/clients', icon: MdBusiness },
  { name: 'Team', path: '/team', icon: MdPeople },
  { name: 'Reports', path: '/reports', icon: MdBarChart },
  { name: 'Invoices', path: '/invoices', icon: MdReceipt },
  { name: 'Manage', path: '/manage', icon: MdSettings }
]

const SidebarContent = ({ onClose }: { onClose?: () => void }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose?.();
  };

  return (
    <>
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
            onClick={onClose}
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
    </>
  );
};

// Mobile header bar with hamburger menu
export const MobileHeader = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();

  // Find current page name
  const currentPage = navItems.find(item => item.path === location.pathname)?.name || 'Harvest-like';

  return (
    <>
      <Flex
        display={{ base: 'flex', md: 'none' }}
        bg="gray.800"
        color="white"
        px={4}
        py={3}
        pt="calc(12px + env(safe-area-inset-top))"
        align="center"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <IconButton
          aria-label="Open menu"
          icon={<MdMenu />}
          variant="ghost"
          color="white"
          _hover={{ bg: 'gray.700' }}
          onClick={onOpen}
          size="lg"
          mr={3}
        />
        <Text fontSize="lg" fontWeight="bold">{currentPage}</Text>
      </Flex>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="gray.800" color="white" maxW="280px">
          <DrawerCloseButton color="white" />
          <DrawerBody display="flex" flexDirection="column" py={6} px={4}>
            <SidebarContent onClose={onClose} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

// Desktop sidebar
const Sidebar = () => {
  return (
    <Box
      w="240px"
      h="100vh"
      bg="gray.800"
      color="white"
      py={6}
      px={4}
      boxShadow="lg"
      display={{ base: 'none', md: 'flex' }}
      flexDirection="column"
      flexShrink={0}
    >
      <SidebarContent />
    </Box>
  )
}

export default Sidebar
