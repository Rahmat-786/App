import React from 'react';
import './DoctorCard.css'; // Import CSS for DoctorCard
import doctorIcon from './doctor-icon.png'

const DoctorCard = ({ doctor }) => {
    return (
        <div className="doctor-card">
            <div className="doctor-card-header">
             <img src={doctorIcon} alt="Doctor" className="doctor-icon"/>
                <h3>{doctor.name}</h3>
                </div>
            <div className="doctor-card-details">
                <p><strong>Experience:</strong> {doctor.experience || 'N/A'}</p>
                <p><strong>Mobile:</strong> {doctor.mobile || 'N/A'}</p>
            </div>
        </div>
    );
};

export default DoctorCard;
