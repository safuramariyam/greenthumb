import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Leaf, User, FlaskConical, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';

type UserRole = 'farmer' | 'labExpert' | 'admin';

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');

  const roles = [
    { value: 'farmer' as UserRole, label: t('auth.farmer'), icon: User },
    { value: 'labExpert' as UserRole, label: t('auth.labExpert'), icon: FlaskConical },
    { value: 'admin' as UserRole, label: t('auth.admin'), icon: Shield },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy auth - store role in localStorage
    localStorage.setItem('userRole', selectedRole);
    localStorage.setItem('isAuthenticated', 'true');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="inline-block bg-gradient-primary p-4 rounded-2xl mb-4"
            >
              <Leaf className="h-12 w-12 text-primary-foreground" />
            </motion.div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isLogin ? t('auth.welcome') : t('auth.getStarted')}
            </h1>
            <p className="text-muted-foreground">{t('app.description')}</p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>{isLogin ? t('auth.login') : t('auth.signup')}</CardTitle>
              <CardDescription>
                {isLogin ? 'Enter your credentials to continue' : 'Create your account to get started'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>

                {!isLogin && (
                  <div className="space-y-3">
                    <Label>{t('auth.selectRole')}</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {roles.map((role) => {
                        const Icon = role.icon;
                        return (
                          <motion.button
                            key={role.value}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedRole(role.value)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              selectedRole === role.value
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <Icon className="h-6 w-6 mx-auto mb-1" />
                            <span className="text-xs">{role.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg">
                  {isLogin ? t('auth.login') : t('auth.signup')}
                </Button>

                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-primary hover:underline"
                  >
                    {isLogin ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
