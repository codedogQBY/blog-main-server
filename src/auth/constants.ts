if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined');
}

export const jwtConstants = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
