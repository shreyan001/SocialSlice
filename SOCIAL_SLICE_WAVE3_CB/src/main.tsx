import ReactDOM from 'react-dom/client'
import neroConfig from '../nerowallet.config'
import Home from './Home'
import { SocialWallet } from './index'
import '@rainbow-me/rainbowkit/styles.css'
import '@/index.css'



ReactDOM.createRoot(document.getElementById('root')!).render(
  <SocialWallet config={neroConfig} mode='sidebar'>
    <Home />
  </SocialWallet>,
)
