const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState({ name: 'John Doe', email: 'john@example.com', address: '123 Tech St' });

  return (
    <div className="auth-card">
      <h2>My Profile</h2>
      <div className="profile-info">
        <label>Name</label>
        <input className="auth-input" disabled={!isEditing} defaultValue={user.name} />
        <label>Email</label>
        <input className="auth-input" disabled defaultValue={user.email} />
        <label>Default Address</label>
        <textarea className="auth-input" disabled={!isEditing} defaultValue={user.address} />
        
        <button className="auth-btn" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Save Profile' : 'Edit Profile'}
        </button>
      </div>
    </div>
  );
};