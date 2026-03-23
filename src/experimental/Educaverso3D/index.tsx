import Scene from './Scene';
import styles from './Educaverso3D.module.css';
import { Link } from 'react-router-dom';

export default function Educaverso3D() {
  return (
    <div className={styles.container}>
      <div className={styles.overlay}>
        <div className={styles.header}>
          <h1>Educaverso 3D Sandbox</h1>
          <p>Módulo Experimental: Explore e Interaja</p>
        </div>
        
        <div className={styles.controls}>
          <div className={styles.hint}>
            🖱️ Use o Mouse para girar • Arraste para mover • Clique nos cubos
          </div>
          <Link to="/game" className={styles.backButton}>
            Sair do Modo 3D
          </Link>
        </div>
      </div>
      
      <div className={styles.canvasContainer}>
        <Scene />
      </div>
    </div>
  );
}
