// Register form component using bootstrap classes to style and should sendt the form data to the backend
// UserService.ts

// @ts-ignore
import React, { useState } from "react";
import { registerUser } from "../services/UserService";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Container from "@mui/material/Container";

type Props = {
  swap: Function;
  loggedIn: Function;
};

const RegisterForm = ({ swap, loggedIn }: Props) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeatedPassword, setRepeatedPassword] = useState('');
  const [email, setEmail] = useState('');
  const [formValid, setFormValid] = useState(false);
  const [formErrors, setFormErrors] = useState({
    username: 'false',
    password: 'false',
    repeatedPassword: 'false',
    email: 'false',
    firstName: 'false',
    lastName: 'false',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const register = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const user = { username, password, email: email.toLowerCase() };
    console.log(user);
    registerUser(user)
      .then((status: any) => {
        if (status === 200) {
          setSuccess('User created successfully');
          loggedIn(true);
        } else {
          setError('Something went wrong');
        }
      }
      );
  }

  const validateField = (fieldName: string, value: any) => {
    switch (fieldName) {
      case 'username':
        setFormErrors({
          ...formErrors,
          username: value.length === 0 ? 'Username is required' : value.length < 4 ? 'Username must be at least 4 characters' : '',
        });
        break;
      case 'password':
        setFormErrors({
          ...formErrors,
          password: value.length === 0 ? 'Password is required' : value.length < 8 ? 'Password must be at least 8 characters' : '',
          repeatedPassword: repeatedPassword.length === 0 ? 'Password is required' : value !== repeatedPassword ? 'Passwords do not match' : '',
        });
        break;
      case 'repeatedPassword':
        setFormErrors({
          ...formErrors,
          repeatedPassword: value.length === 0 ? 'Password is required' : value !== password ? 'Passwords do not match' : '',
        });
        break;
      case 'email':
        setFormErrors({
          ...formErrors,
          email: value.length === 0 ? 'Email is required' : !/^[a-z0-9.]{1,64}@[a-z0-9.]{1,64}$/i.test(value) ? 'Invalid email format' : '',
        });
        break;
      default:
        break;
    }
    setFormValid(Object.values(formErrors).every(error => error === ''));
  }

  const onChangeUsername = (value: string) => {
    setUsername(value);
    validateField('username', value);
  }

  const onChangePassword = (value: string) => {
    setPassword(value);
    validateField('password', value);
  }

  const onChangeRepeatedPassword = (value: string) => {
    setRepeatedPassword(value);
    validateField('repeatedPassword', value);
  }

  const onChangeEmail = (value: string) => {
    setEmail(value);
    validateField('email', value);
  }

  const buttonDisabled = () => {
    return !formValid;
  }

  return (
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
            sx={{
              marginTop: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Register
          </Typography>
          <Box component="form" onSubmit={register} noValidate sx={{ mt: 1 }}>
            <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                onChange={(event) => onChangeUsername(event.target.value)}
            />
            <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                onChange={(event) => onChangeEmail(event.target.value)}
            />
            <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                onChange={(event) => onChangePassword(event.target.value)}
            />
            <TextField
                margin="normal"
                required
                fullWidth
                name="repeatedPassword"
                label="Repeat Password"
                type="password"
                id="repeatedPassword"
                autoComplete="current-password"
                onChange={(event) => onChangeRepeatedPassword(event.target.value)}
            />
            <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={buttonDisabled()}
                sx={{ mt: 3, mb: 2 }}
            >
              Sign Up
            </Button>
            <Grid container>
              <Grid item>
                <Link href="#" variant="body2" onClick={e => swap(e)}>
                  {"Already have an account? Sign In"}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
        {error && <div className="alert alert-danger mt-2">{error}</div>}
        {success && <div className="alert alert-success mt-2">{success}</div>}
      </Container>
  );
}

export default RegisterForm;
