import React from "react";

interface ProfileCardProps {
  name: string;
  email: string;
  avatarUrl: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ name, email, avatarUrl }) => {
  return (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-md w-fit">
      {/* Avatar */}
      <img
        src={avatarUrl}
        alt={name}
        className="w-8 h-8 rounded-full object-cover"
      />
      {/* User Info */}
      <div className="flex flex-col">
        <span className="text-gray-900 font-semibold">{name}</span>
        <span className="text-gray-500 text-sm">{email}</span>
      </div>
    </div>
  );
};

export default ProfileCard;