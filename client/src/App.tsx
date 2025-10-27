import { BrowserRouter, Routes, Route } from 'react-router-dom'

// UI
import Layout from './componets/layout/Layout'

//Pages
import Home from './pages/Home'
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
