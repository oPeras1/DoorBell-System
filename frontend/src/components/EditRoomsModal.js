import React, { useState } from 'react';
import HousePlanSelector from './HousePlanSelector';

const EditRoomsModal = ({ visible, onClose, onSave, currentRooms = [], loading = false, error = '' }) => {
  const [selectedRooms, setSelectedRooms] = useState(currentRooms);

  const handleRoomsSelect = (rooms) => {
    setSelectedRooms(rooms);
  };

  const handleSave = async () => {
    if (selectedRooms.length === 0) {
      alert('Please select at least one room');
      return;
    }
    
    try {
      await onSave(selectedRooms);
      onClose();
    } catch (error) {
      console.error('Error updating rooms:', error);
    }
  };

  const handleClose = () => {
    setSelectedRooms(currentRooms); // Reset to original rooms
    onClose();
  };

  React.useEffect(() => {
    if (visible) {
      setSelectedRooms(currentRooms);
    }
  }, [visible, currentRooms]);

  return (
    <HousePlanSelector
      visible={visible}
      selectedRooms={selectedRooms}
      onRoomsSelect={handleRoomsSelect}
      onClose={handleClose}
      multiSelect={true}
      viewOnly={false}
      onConfirm={handleSave}
      loading={loading}
      error={error}
    />
  );
};

export default EditRoomsModal;