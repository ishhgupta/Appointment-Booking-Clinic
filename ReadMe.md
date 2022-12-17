## Appointment Booking
----

## Description 
A server application that books appointments for clinic.

## Workflow
- Three types of users : doctor, receptionist, patient
- Users can register and login using emailid
- Authentication of users happens using JSON Web Token
- Receptionist can book appointment for patients with doctors (/appointment) given patient email, Doctor email, start and Endtime
- Doctor can book appointment using time and patientEmail (/appointment)
- Patient can book appointment using time and doctorEmail (/appointment)
- Only one appointment can exist for a patient
- Validates for doctors to not have clash in multiple appointments
- Patients can upload medical record file to their appointment
- Doctor can fetch list of all their appointments
- Doctors can fetch patient information providing patientId

## Installation
- Clone this repo
- Navigate to the folder 
- Install all the nodemodules ```npm install```
- Set up the mongodb database
- Run the server ```nodemon index.js```
- Make the requests using Postman and provided postman collection