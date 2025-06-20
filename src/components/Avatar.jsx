import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VRMLoaderPlugin } from "@pixiv/three-vrm";
import {
  VRMAnimationLoaderPlugin,
  createVRMAnimationClip,
} from "@pixiv/three-vrm-animation";
import * as THREE from "three";

const Avatar = ({ modelUrl, animationUrl }) => {
  const avatarRef = useRef();
  const mixerRef = useRef(null);
  const vrmRef = useRef(null);
  const actionRef = useRef(null);

  useEffect(() => {
    if (!modelUrl || !animationUrl) return;

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

    let mixer;
    let action;

    // Load VRM model first
    loader.load(
      modelUrl,
      (gltf) => {
        console.log("VRM model loaded:", gltf);

        const vrm = gltf.userData.vrm;
        if (!vrm) {
          console.error("No VRM data found in the loaded model");
          return;
        }

        // Add to scene
        avatarRef.current.add(vrm.scene);
        vrmRef.current = vrm;

        // Create animation mixer with the VRM scene
        mixer = new THREE.AnimationMixer(vrm.scene);
        mixerRef.current = mixer;

        console.log("VRM humanoid bones:", vrm.humanoid?.humanBones);

        // Load animation after VRM is loaded
        loader.load(
          animationUrl,
          (animGltf) => {
            console.log("Animation loaded:", animGltf);

            const vrmAnimations = animGltf.userData.vrmAnimations;
            console.log("VRM animations found:", vrmAnimations);

            if (vrmAnimations && vrmAnimations.length > 0) {
              try {
                // Create VRM animation clip with proper retargeting
                const clip = createVRMAnimationClip(vrmAnimations[0], vrm);
                console.log("Animation clip created:", clip);

                if (clip && clip.tracks.length > 0) {
                  action = mixer.clipAction(clip);
                  actionRef.current = action;

                  // Configure animation
                  action.setLoop(THREE.LoopRepeat);
                  action.clampWhenFinished = false;
                  action.reset();
                  action.play();

                  console.log("Animation action started");
                } else {
                  console.error("Created clip has no tracks");
                }
              } catch (error) {
                console.error("Error creating VRM animation clip:", error);
              }
            } else {
              console.error("No VRM animations found in the loaded file");

              // Fallback: try to use regular animations if VRM animations not found
              if (animGltf.animations && animGltf.animations.length > 0) {
                console.log("Trying fallback with regular animations");
                const regularClip = animGltf.animations[0];
                action = mixer.clipAction(regularClip);
                actionRef.current = action;
                action.play();
              }
            }
          },
          (progress) => {
            console.log("Animation loading progress:", progress);
          },
          (error) => {
            console.error("Failed to load animation:", error);
          }
        );
      },
      (progress) => {
        console.log("VRM loading progress:", progress);
      },
      (error) => {
        console.error("Failed to load VRM model:", error);
      }
    );

    // Cleanup function
    return () => {
      if (actionRef.current) {
        actionRef.current.stop();
        actionRef.current = null;
      }

      if (mixer) {
        mixer.stopAllAction();
        mixer.uncacheRoot(mixer.getRoot());
        mixerRef.current = null;
      }

      if (vrmRef.current) {
        // Proper cleanup of VRM resources
        vrmRef.current.scene.traverse((obj) => {
          if (obj.isMesh && !obj.skeleton) {
            if (obj.geometry) {
              obj.geometry.dispose();
            }
            if (obj.material) {
              if (Array.isArray(obj.material)) {
                obj.material.forEach((mat) => {
                  if (mat.map) mat.map.dispose();
                  mat.dispose();
                });
              } else {
                if (obj.material.map) obj.material.map.dispose();
                obj.material.dispose();
              }
            }
          }
        });

        if (avatarRef.current && vrmRef.current.scene) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          avatarRef.current.remove(vrmRef.current.scene);
        }

        vrmRef.current = null;
      }
    };
  }, [modelUrl, animationUrl]);

  useFrame((_, delta) => {
    // Update VRM first (important for proper bone updates)
    if (vrmRef.current) {
      vrmRef.current.update(delta);
    }

    // Then update animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  return <group ref={avatarRef} position={[0,-0.4,1.4]}/>;
};

export default Avatar;
