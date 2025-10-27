import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './componets/layout/Layout'
import Home from './pages/Home'
import Players from './pages/Players'
import Player from './pages/Player'
import Leaderboard from './pages/Leaderboard'

function App() {

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/players" element={<Players />} />
          <Route path="/players/:id" element={<Player />} />
          <Route path="/leaderboard" element={<Leaderboard />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>


    </BrowserRouter>
  );
}

export default App
