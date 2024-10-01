import React from 'react';
import { FaCalendarAlt, FaUsers, FaInfoCircle } from "react-icons/fa";
import dayjs from "dayjs";

interface Event {
  tsp: string;
  tspEnd: string;
  participationsCount?: number;
  status?: number;
}

interface EventInfoProps {
  event: Event;
}

const EventInfo: React.FC<EventInfoProps> = ({ event }) => {
  const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-center mr-6 mb-2">
      <Icon className="text-blue-500 mr-2" />
      <span>{label}: {value}</span>
    </div>
  );

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
      <div className="flex flex-wrap items-center text-sm text-gray-600">
        <InfoItem 
          icon={FaCalendarAlt} 
          label="Début" 
          value={dayjs(event.tsp).format('DD/MM/YYYY à HH:mm')} 
        />
        <InfoItem 
          icon={FaCalendarAlt} 
          label="Fin" 
          value={dayjs(event.tspEnd).format('DD/MM/YYYY à HH:mm')} 
        />
        <InfoItem 
          icon={FaUsers} 
          label="Participants" 
          value={event.participationsCount ?? "Non spécifié"} 
        />
        <InfoItem 
          icon={FaInfoCircle} 
          label="Statut" 
          value={event.status ?? "Non spécifié"} 
        />
      </div>
    </div>
  );
};

export default EventInfo;