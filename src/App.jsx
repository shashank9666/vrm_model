import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Avatar from './components/Avatar'

function App() {
  return (
    <Canvas camera={{ position: [0, 1.5, 3] }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <OrbitControls />
      <Avatar 
        modelUrl="/models/miku.vrm" 
        animationUrl="/animations/dance.vrma" 
      />
    </Canvas>
  )
}

export default App
