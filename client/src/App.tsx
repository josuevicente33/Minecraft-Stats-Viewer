import { BrowserRouter, Routes, Route } from 'react-router-dom'

// UI
import Layout from './components/layout/Layout'

//Pages
import Home from './pages/Home'
import World from './pages/World'
import Players from './pages/Players'
import Player from './pages/Player'
import Leaderboard from './pages/Leaderboard'

import NotFound from './pages/NotFound'


function App() {

  return (
    <BrowserRouter>
      <Layout>
        <Routes>

          <Route path="/" element={<Home />} />
          <Route path="/world" element={<World />} />
          <Route path="/players" element={<Players />} />
          <Route path="/players/:id" element={<Player />} />
          <Route path="/leaderboard" element={<Leaderboard />} />

          <Route path="*" element={<NotFound />} />
          
        </Routes>
      </Layout>


    </BrowserRouter>
  );
}

export default App
