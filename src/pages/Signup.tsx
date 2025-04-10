
import { Header } from '@/components/layout/Header';
import { SignupForm } from '@/components/auth/SignupForm';

const Signup = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md">
          <SignupForm />
        </div>
      </main>
    </div>
  );
};

export default Signup;
