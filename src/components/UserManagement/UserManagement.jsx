import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Card, Table, Badge } from 'react-bootstrap';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // Note: This is a simplified version. In a real app, you'd need Firebase Admin SDK
        // to get user list from Authentication. This shows Firestore users if any.
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const userList = userSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(userList);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Error al cargar usuarios');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="user-management-container">
        <Card>
          <Card.Body>
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando usuarios...</p>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <Card>
        <Card.Header>
          <h4>Gestión de Usuarios</h4>
          <p className="text-muted mb-0">
            Vista de usuarios registrados en la aplicación
          </p>
        </Card.Header>
        <Card.Body>
          {error && (
            <div className="alert alert-warning" role="alert">
              {error}
            </div>
          )}
          
          <div className="admin-notice">
            <div className="alert alert-info" role="alert">
              <strong>Nota para Administradores:</strong>
              <br />
              Para agregar, editar o eliminar usuarios, use el{' '}
              <a 
                href="https://console.firebase.google.com/project/kombuchaapp/authentication/users" 
                target="_blank" 
                rel="noopener noreferrer"
                className="alert-link"
              >
                Firebase Console
              </a>
              .
            </div>
          </div>

          {users.length > 0 ? (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Última Actividad</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>{user.name || 'N/A'}</td>
                    <td>
                      <Badge bg={user.role === 'admin' ? 'danger' : 'primary'}>
                        {user.role || 'user'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={user.active ? 'success' : 'secondary'}>
                        {user.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td>
                      {user.lastActivity 
                        ? new Date(user.lastActivity.toDate()).toLocaleDateString('es-ES')
                        : 'N/A'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted">
                No hay usuarios registrados en Firestore.
                <br />
                Los usuarios de autenticación se gestionan desde Firebase Console.
              </p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default UserManagement; 