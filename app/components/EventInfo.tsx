import React from 'react';
import { FaCalendarAlt, FaUsers, FaInfoCircle } from "react-icons/fa";
import { IconType } from 'react-icons';
import dayjs from "dayjs";

interface Event {
  tsp: string;
  tspEnd: string;
  participationsCount?: number;
  status?: number;
}

interface InfoItemProps {
  icon: IconType;
  label: string;
  value: string | number;
}

interface EventInfoProps {
  event: Event;
}

const getStatusLabel = (status?: number): string => {
  switch (status) {
    case 1:
      return "Validé";
    case 0:
      return "Refusé";
    case 2:
      return "En attente";
    case 3:
      return "En cours de traitement";
    default:
      return "Non spécifié";
  }
};

const EventInfo: React.FC<EventInfoProps> = ({ event }) => {
  const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value }) => (
    <div className="flex items-center mb-2 mr-6">
      <Icon className="mr-2 text-blue-500" />
      <span>{label}: {value}</span>
    </div>
  );

  return (
    <div className="p-6 mb-6 bg-white rounded-lg shadow-sm">
      <div className="flex flex-wrap items-center text-sm text-gray-600">
        <InfoItem 
          icon={FaCalendarAlt} 
          label="Début" 
          value={dayjs(event.tsp).format('DD/MM/YYYY')} 
        />
        <InfoItem 
          icon={FaCalendarAlt} 
          label="Fin" 
          value={dayjs(event.tspEnd).format('DD/MM/YYYY')} 
        />
        <InfoItem 
          icon={FaUsers} 
          label="Participants" 
          value={event.participationsCount ?? "Non spécifié"} 
        />
        <InfoItem 
          icon={FaInfoCircle} 
          label="Statut"
          value={getStatusLabel(event.status)} 
        />
      </div>
    </div>
  );
};

export default EventInfo;