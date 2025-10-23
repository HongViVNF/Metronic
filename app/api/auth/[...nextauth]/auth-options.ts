// import { PrismaAdapter } from '@next-auth/prisma-adapter';
// import bcrypt from 'bcrypt';
// import { NextAuthOptions, Session, User } from 'next-auth';
// import { JWT } from 'next-auth/jwt';
// import CredentialsProvider from 'next-auth/providers/credentials';
// import GoogleProvider from 'next-auth/providers/google';
// import prisma from '@/lib/prisma';

// const authOptions: NextAuthOptions = {
//   adapter: PrismaAdapter(prisma),
//   providers: [
//     CredentialsProvider({
//       name: 'Credentials',
//       credentials: {
//         email: { label: 'Email', type: 'text' },
//         password: { label: 'Password', type: 'password' },
//         rememberMe: { label: 'Remember me', type: 'boolean' },
//       },
//       async authorize(credentials) {
//         if (!credentials || !credentials.email || !credentials.password) {
//           throw new Error(
//             JSON.stringify({
//               code: 400,
//               message: 'Please enter both email and password.',
//             }),
//           );
//         }

//         const user = await prisma.user.findUnique({
//           where: { email: credentials.email },
//         });

//         if (!user) {
//           throw new Error(
//             JSON.stringify({
//               code: 404,
//               message: 'User not found. Please register first.',
//             }),
//           );
//         }

//         const isPasswordValid = await bcrypt.compare(
//           credentials.password,
//           user.password || '',
//         );

//         if (!isPasswordValid) {
//           throw new Error(
//             JSON.stringify({
//               code: 401,
//               message: 'Invalid credentials. Incorrect password.',
//             }),
//           );
//         }

//         if (user.status !== 'ACTIVE') {
//           throw new Error(
//             JSON.stringify({
//               code: 403,
//               message: 'Account not activated. Please verify your email.',
//             }),
//           );
//         }

//         // Update `lastSignInAt` field
//         await prisma.user.update({
//           where: { id: user.id },
//           data: { lastSignInAt: new Date() },
//         });

//         return {
//           id: user.id,
//           status: user.status,
//           email: user.email,
//           name: user.name || 'Anonymous',
//           roleId: user.roleId,
//           avatar: user.avatar,
//         };
//       },
//     }),
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//       allowDangerousEmailAccountLinking: true,
//       async profile(profile) {
//         const existingUser = await prisma.user.findUnique({
//           where: { email: profile.email },
//           include: {
//             role: {
//               select: {
//                 id: true,
//                 name: true,
//               },
//             },
//           },
//         });

//         if (existingUser) {
//           // Update `lastSignInAt` field for existing users
//           await prisma.user.update({
//             where: { id: existingUser.id },
//             data: {
//               name: profile.name,
//               avatar: profile.picture || null,
//               lastSignInAt: new Date(),
//             },
//           });

//           return {
//             id: existingUser.id,
//             email: existingUser.email,
//             name: existingUser.name || 'Anonymous',
//             status: existingUser.status,
//             roleId: existingUser.roleId,
//             roleName: existingUser.role.name,
//             avatar: existingUser.avatar,
//           };
//         }

//         const defaultRole = await prisma.userRole.findFirst({
//           where: { isDefault: true },
//         });

//         if (!defaultRole) {
//           throw new Error(
//             'Default role not found. Unable to create a new user.',
//           );
//         }

//         // Create a new user and account
//         const newUser = await prisma.user.create({
//           data: {
//             email: profile.email,
//             name: profile.name,
//             password: '', // No password for OAuth users
//             avatar: profile.picture || null,
//             emailVerifiedAt: new Date(),
//             roleId: defaultRole.id,
//             status: 'ACTIVE',
//           },
//         });

//         return {
//           id: newUser.id,
//           email: newUser.email,
//           name: newUser.name || 'Anonymous',
//           status: newUser.status,
//           avatar: newUser.avatar,
//           roleId: newUser.roleId,
//           roleName: defaultRole.name,
//         };
//       },
//     }),
//   ],
//   session: {
//     strategy: 'jwt',
//     maxAge: 24 * 60 * 60,
//   },
//   callbacks: {
//     async jwt({
//       token,
//       user,
//       session,
//       trigger,
//     }: {
//       token: JWT;
//       user: User;
//       session?: Session;
//       trigger?: 'signIn' | 'signUp' | 'update';
//     }) {
//       if (trigger === 'update' && session?.user) {
//         token = session.user;
//       } else {
//         if (user && user.roleId) {
//           const role = await prisma.userRole.findUnique({
//             where: { id: user.roleId },
//           });

//           token.id = (user.id || token.sub) as string;
//           token.email = user.email;
//           token.name = user.name;
//           token.avatar = user.avatar;
//           token.status = user.status;
//           token.roleId = user.roleId;
//           token.roleName = role?.name;
//         }
//       }

//       return token;
//     },
//     async session({ session, token }: { session: Session; token: JWT }) {
//       if (session.user) {
//         session.user.id = token.id;
//         session.user.email = token.email;
//         session.user.name = token.name;
//         session.user.avatar = token.avatar;
//         session.user.status = token.status;
//         session.user.roleId = token.roleId;
//         session.user.roleName = token.roleName;
//       }
//       return session;
//     },
//   },
//   pages: {
//     signIn: '/signin',
//   },
// };

// export default authOptions;
import prisma from '@/lib/prisma';
import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';

const authOptions: NextAuthOptions = {
  // Use Prisma adapter only for providers that need it (e.g., Google)
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember me', type: 'boolean' },
      },
      async authorize(credentials): Promise<any | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error(
            JSON.stringify({
              code: 400,
              message: 'Please enter both email and password.',
            }),
          );
        }

        // Call login API
        console.log('email', credentials.email, credentials.password);
        const loginResponse = await fetch('https://demo-backend.ls01.vnfoods.vn/api/v1/app/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        const loginData = await loginResponse.json();
        console.log('loginData', loginData);
        if (!loginResponse.ok || !loginData.success || !loginData.data.user) {
          throw new Error(
            JSON.stringify({
              code: loginResponse.status,
              message: loginData.data?.detail || 'Authentication failed.',
            }),
          );
        }

        const { user, accessToken, settings } = loginData.data;

        if (!user.isActive) {
          throw new Error(
            JSON.stringify({
              code: 403,
              message: 'Account not activated. Please verify your email.',
            }),
          );
        }

        // Call work-context API
        const workContextResponse = await fetch('https://demo-backend.ls01.vnfoods.vn/api/v1/app/work-context', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({}),
        });

        const workContextData = await workContextResponse.json();
        console.log('workContextData', workContextData);
        if (!workContextResponse.ok || !workContextData.success || !workContextData.data) {
          throw new Error(
            JSON.stringify({
              code: workContextResponse.status,
              message: workContextData.data?.detail || 'Failed to fetch work context.',
            }),
          );
        }

        const { roles, permissions, teams, apps } = workContextData.data;

        // Return a User object compatible with NextAuth (no Prisma interaction)
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name || 'Anonymous',
          avatar: user.pictureUrl || null,
          status: user.isActive ? 'ACTIVE' : 'INACTIVE',
          accessToken: accessToken,
          settings,
          workContext: {
            roles,
            permissions,
            teams,
            apps,
          },
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      async profile(profile) {
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email },
          include: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (existingUser) {
          // Update `lastSignInAt` field for existing users
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: profile.name,
              avatar: profile.picture || null,
              lastSignInAt: new Date(),
            },
          });

          return {
            id: existingUser.id.toString(),
            email: existingUser.email,
            name: existingUser.name || 'Anonymous',
            status: existingUser.status,
            roleId: existingUser.roleId,
            roleName: existingUser.role.name,
            avatar: existingUser.avatar,
          };
        }

        const defaultRole = await prisma.userRole.findFirst({
          where: { isDefault: true },
        });

        if (!defaultRole) {
          throw new Error('Default role not found. Unable to create a new user.');
        }

        // Create a new user and account
        const newUser = await prisma.user.create({
          data: {
            email: profile.email,
            name: profile.name,
            password: '', // No password for OAuth users
            avatar: profile.picture || null,
            emailVerifiedAt: new Date(),
            roleId: defaultRole.id,
            status: 'ACTIVE',
          },
        });

        return {
          id: newUser.id.toString(),
          email: newUser.email,
          name: newUser.name || 'Anonymous',
          status: newUser.status,
          avatar: newUser.avatar,
          roleId: newUser.roleId,
          roleName: defaultRole.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt', // Use JWT for session management
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      console.log('jwt callback - user:', user, 'token:', token);
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.avatar = user.avatar || null;
        token.status = user.status || 'INACTIVE';
        token.accessToken = user.accessToken || null;
        token.settings = user.settings || null;
        token.workContext = user.workContext || null;
        token.roleId = user.roleId || null;
        token.roleName = user.roleName || null;
      }
      console.log('jwt callback - updated token:', token);
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      console.log('session callback - token:', token);
      if (session.user && token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name || 'Anonymous';
        session.user.avatar = token.avatar || null;
        session.user.status = token.status || 'INACTIVE';
        session.user.accessToken = token.accessToken || null;
        session.user.settings = token.settings || null;
        session.user.workContext = token.workContext || null;
        session.user.roleId = token.roleId || null;
        session.user.roleName = token.roleName || null;
      } else {
        console.error('Session or token is undefined:', { session, token });
      }
      console.log('session callback - updated session:', session);
      return session;
    },
  },
  pages: {
    signIn: '/signin',
  },
};

export default authOptions;