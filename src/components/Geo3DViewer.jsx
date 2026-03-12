import React, { useEffect, useRef, useState } from 'react'
import { Box, Alert, CircularProgress } from '@mui/material'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export default function Geo3DViewer({ gltfData, height = 420 }) {
  const containerRef = useRef(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current || !gltfData) return undefined

    let renderer
    let animationId = null
    let disposed = false

    const container = containerRef.current
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf3f4f6)

    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / height, 0.1, 100000)
    camera.position.set(120, 120, 120)

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio || 1)
    renderer.setSize(container.clientWidth, height)
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95)
    scene.add(ambientLight)

    const directional = new THREE.DirectionalLight(0xffffff, 0.85)
    directional.position.set(180, 260, 120)
    scene.add(directional)

    const grid = new THREE.GridHelper(600, 24, 0xb3b9c4, 0xd7dce5)
    scene.add(grid)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 0, 0)

    const loader = new GLTFLoader()
    loader.parse(
      JSON.stringify(gltfData),
      '/',
      (parsed) => {
        if (disposed) return

        const object = parsed.scene || parsed.scenes?.[0]
        if (!object) {
          setError('No se pudo interpretar la escena 3D')
          setLoading(false)
          return
        }

        scene.add(object)

        const bounds = new THREE.Box3().setFromObject(object)
        const size = bounds.getSize(new THREE.Vector3())
        const center = bounds.getCenter(new THREE.Vector3())

        object.position.sub(center)

        const maxDimension = Math.max(size.x, size.y, size.z, 1)
        const distance = maxDimension * 2.2
        camera.position.set(distance, distance, distance)
        camera.near = Math.max(0.1, distance / 500)
        camera.far = Math.max(2000, distance * 12)
        camera.updateProjectionMatrix()
        controls.update()

        setLoading(false)
      },
      () => {
        if (!disposed) {
          setError('No se pudo cargar el modelo 3D')
          setLoading(false)
        }
      }
    )

    const onResize = () => {
      if (!container || !renderer) return
      const width = container.clientWidth || 1
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    const animate = () => {
      controls.update()
      renderer.render(scene, camera)
      animationId = window.requestAnimationFrame(animate)
    }

    animate()
    window.addEventListener('resize', onResize)

    return () => {
      disposed = true
      window.removeEventListener('resize', onResize)
      if (animationId) window.cancelAnimationFrame(animationId)
      controls.dispose()
      scene.traverse((child) => {
        if (!child.isMesh) return
        if (child.geometry) child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat?.dispose && mat.dispose())
        } else if (child.material?.dispose) {
          child.material.dispose()
        }
      })
      renderer?.dispose()
      if (container && renderer?.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [gltfData, height])

  return (
    <Box sx={{ position: 'relative' }}>
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255,255,255,0.72)'
          }}
        >
          <CircularProgress size={30} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height,
          borderRadius: 1,
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.08)'
        }}
      />
    </Box>
  )
}
