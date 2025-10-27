import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './componets/layout/Layout'
import Home from './pages/Home'

function App() {

  return (


    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>


    </BrowserRouter>
  );
}

export default App
