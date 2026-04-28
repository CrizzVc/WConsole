import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ControlPromptProps {
  btn: 'A' | 'B' | 'X' | 'Y' | 'L' | 'R' | 'Enter' | 'Esc' | 'L1' | 'R1' | 'Options' | 'Explore' | 'Back';
  label: string;
  inputMode: 'keyboard' | 'gamepad';
}

const ControlPrompt: React.FC<ControlPromptProps> = ({ btn, label, inputMode }) => {
  const isGamepad = inputMode === 'gamepad';
  
  const getBtnContent = () => {
    if (isGamepad) {
      switch (btn) {
        case 'A': return <View style={[styles.psBtn, { backgroundColor: '#3b82f6' }]}><Text style={styles.psBtnText}>✕</Text></View>; // Cross
        case 'B': case 'Back': return <View style={[styles.psBtn, { backgroundColor: '#ef4444' }]}><Text style={styles.psBtnText}>○</Text></View>; // Circle
        case 'Y': return <View style={[styles.psBtn, { backgroundColor: '#10b981' }]}><Text style={styles.psBtnText}>△</Text></View>; // Triangle
        case 'X': return <View style={[styles.psBtn, { backgroundColor: '#ec4899' }]}><Text style={styles.psBtnText}>□</Text></View>; // Square
        case 'L1': case 'L': return <View style={styles.psShoulder}><Text style={styles.psShoulderText}>L1</Text></View>;
        case 'R1': case 'R': return <View style={styles.psShoulder}><Text style={styles.psShoulderText}>R1</Text></View>;
        case 'Options': return <View style={styles.psOptions}><Ionicons name="menu" size={12} color="#FFF" /></View>;
        case 'Explore': return <Ionicons name="apps" size={16} color="#FFF" />;
        default: return <View style={styles.psBtn}><Text style={styles.psBtnText}>{btn}</Text></View>;
      }
    } else {
      switch (btn) {
        case 'A': case 'Enter': return <View style={styles.kbKey}><Text style={styles.kbKeyText}>ENTER</Text></View>;
        case 'B': case 'Esc': case 'Back': return <View style={styles.kbKey}><Text style={styles.kbKeyText}>ESC</Text></View>;
        case 'Explore': return <Ionicons name="apps" size={16} color="#FFF" />;
        default: return <View style={styles.kbKey}><Text style={styles.kbKeyText}>{btn}</Text></View>;
      }
    }
  };

  return (
    <View style={styles.promptContainer}>
      {getBtnContent()}
      {label ? <Text style={styles.promptLabel}>{label}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  promptContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 },
  promptLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  // PS Button Styles
  psBtn: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2 },
  psBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  psShoulder: { backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#555' },
  psShoulderText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  psOptions: { backgroundColor: '#444', width: 22, height: 16, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  
  // Keyboard Key Styles
  kbKey: { backgroundColor: '#222', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#444', minWidth: 30, alignItems: 'center' },
  kbKeyText: { color: '#AAA', fontSize: 10, fontWeight: 'bold' },
});

export default ControlPrompt;
