import { BrowserRouter } from 'react-router-dom'
import AppRouter from './AppRouter'
import './styles/themes.css'

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  )
}
