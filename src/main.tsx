import { ChakraProvider } from '@chakra-ui/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'
import AppProviders from './contexts/AppProviders.js'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider>
      <AppProviders>
        <App />
      </AppProviders>
    </ChakraProvider>
  </React.StrictMode>,
)