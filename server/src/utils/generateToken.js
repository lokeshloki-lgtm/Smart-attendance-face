import jwt from 'jsonwebtoken';

export const generateToken = (user) => {
  const token = jwt.sign(
    {
      _id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return token;
};

export const generateRefreshToken = (user) => {
  const token = jwt.sign(
    {
      _id: user._id,
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  return token;
};
