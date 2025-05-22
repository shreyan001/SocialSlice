import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import neroConfig from '../nerowallet.config'
import Home from './Home'
import ChatPage from './pages/ChatPage'
import { SocialWallet } from './index'
import '@rainbow-me/rainbowkit/styles.css'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <SocialWallet config={neroConfig} mode='sidebar'>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </Router>
  </SocialWallet>,
)
