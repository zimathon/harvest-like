import { ReactNode } from 'react'
import { Box, Flex } from '@chakra-ui/react'
import Sidebar, { MobileHeader } from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <Flex h="100vh" direction={{ base: 'column', md: 'row' }}>
      <Sidebar />
      <MobileHeader />
      <Box
        flex="1"
        p={{ base: 3, md: 5 }}
        pb={{ base: 'calc(12px + env(safe-area-inset-bottom))', md: 5 }}
        overflowY="auto"
        sx={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </Box>
    </Flex>
  )
}

export default Layout
