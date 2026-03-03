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
      <Box flex="1" p={{ base: 3, md: 5 }} overflowY="auto">
        {children}
      </Box>
    </Flex>
  )
}

export default Layout
