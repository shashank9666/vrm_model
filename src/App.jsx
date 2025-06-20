import './App.css'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function App() {
  return (
    <Canvas>
      <OrbitControls />
      <mesh>
        <meshNormalMaterial />
        <boxGeometry />
      </mesh>
    </Canvas>
  )
}

export default App
