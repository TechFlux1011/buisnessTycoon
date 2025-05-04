import { db, doc, getDoc, setDoc, updateDoc } from '../config/firebase';

class SaveDataService {
  // Save game state to Firestore
  static async saveGameState(userId, gameState) {
    try {
      const saveRef = doc(db, 'saves', userId);
      const saveDoc = await getDoc(saveRef);
      
      if (!saveDoc.exists()) {
        // Create a new save
        await setDoc(saveRef, {
          gameState,
          lastSaved: new Date(),
          createdAt: new Date()
        });
      } else {
        // Update existing save
        await updateDoc(saveRef, {
          gameState,
          lastSaved: new Date()
        });
      }
      return true;
    } catch (error) {
      console.error("Error saving game state:", error);
      return false;
    }
  }

  // Load game state from Firestore
  static async loadGameState(userId) {
    try {
      const saveRef = doc(db, 'saves', userId);
      const saveDoc = await getDoc(saveRef);
      
      if (saveDoc.exists()) {
        return saveDoc.data().gameState;
      } else {
        return null; // No save data found
      }
    } catch (error) {
      console.error("Error loading game state:", error);
      return null;
    }
  }

  // Auto-save game state (to be called periodically)
  static autoSaveGameState(userId, gameState) {
    return this.saveGameState(userId, gameState);
  }

  // Check if a save exists for the user
  static async hasSaveData(userId) {
    try {
      const saveRef = doc(db, 'saves', userId);
      const saveDoc = await getDoc(saveRef);
      return saveDoc.exists();
    } catch (error) {
      console.error("Error checking save data:", error);
      return false;
    }
  }

  // Delete save data (used when starting a new game)
  static async deleteSaveData(userId) {
    try {
      const saveRef = doc(db, 'saves', userId);
      await setDoc(saveRef, { deleted: true, deletedAt: new Date() });
      return true;
    } catch (error) {
      console.error("Error deleting save data:", error);
      return false;
    }
  }
}

export default SaveDataService; 