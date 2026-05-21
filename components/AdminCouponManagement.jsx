import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminCouponManagement.css';

export default function AdminCouponManagement() {
  const [classId, setClassId] = useState('');
  const [count, setCount] = useState(1);
  const [coupons, setCoupons] = useState([]);
  const [message, setMessage] = useState(null);

  // Fetch existing coupons
  const fetchCoupons = async () => {
    try {
      const res = await axios.get('/api/coupons');
      setCoupons(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/coupons/generate', { classId, count });
      setMessage({ type: 'success', text: `Generated ${res.data.coupons.length} coupon(s).` });
      fetchCoupons();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Generation failed' });
    }
  };

  const handleDeactivate = async (id) => {
    await axios.patch(`/api/coupons/${id}/deactivate`);
    fetchCoupons();
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/coupons/${id}`);
    fetchCoupons();
  };

  return (
    <div className="admin-coupon-management">
      <h2>Coupon Administration</h2>
      <form className="generate-form" onSubmit={handleGenerate}>
        <label>
          Class ID:
          <input type="text" value={classId} onChange={(e) => setClassId(e.target.value)} required />
        </label>
        <label>
          Count:
          <input type="number" min="1" value={count} onChange={(e) => setCount(parseInt(e.target.value, 10))} required />
        </label>
        <button type="submit">Generate Coupons</button>
      </form>
      {message && <p className={message.type === 'error' ? 'error-msg' : 'success-msg'}>{message.text}</p>}
      <table className="coupon-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Class</th>
            <th>Used</th>
            <th>Used By</th>
            <th>Used At</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.class}</td>
              <td>{c.isUsed ? 'Yes' : 'No'}</td>
              <td>{c.usedBy || '-'}
</td>
              <td>{c.usedAt ? new Date(c.usedAt).toLocaleString() : '-'}
</td>
              <td>{c.isActive ? 'Yes' : 'No'}</td>
              <td>
                {c.isActive && <button onClick={() => handleDeactivate(c.id)}>Deactivate</button>}
                <button onClick={() => handleDelete(c.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
