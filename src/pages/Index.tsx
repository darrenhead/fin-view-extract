
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, Shield, Upload } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-blue-50 to-white">
          <div className="container max-w-6xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-6">
              Analyze Your Financial Statements with Ease
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-10">
              Upload your bank statements and financial documents, and FinView will help you extract and analyze your transaction data all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/signup">
                  Get Started
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Easy Upload</h3>
                <p className="text-gray-600">
                  Simply upload your PDF financial statements through our secure interface.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Data Extraction</h3>
                <p className="text-gray-600">
                  Our system automatically attempts to extract transaction data from your statements.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Transaction Viewing</h3>
                <p className="text-gray-600">
                  View all your extracted transactions in a clean, organized interface.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Security Section */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="container max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2">
                <h2 className="text-3xl font-bold mb-6">Your Data Security is Our Priority</h2>
                <p className="text-gray-600 mb-6">
                  We take the security of your financial information seriously. All your data is encrypted, and we never share your information with third parties.
                </p>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Secure file storage</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>User authentication</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Private access control</span>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="bg-white p-8 rounded-lg shadow-md border">
                  <FileText className="h-16 w-16 text-primary mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-center mb-4">Ready to get started?</h3>
                  <p className="text-center text-gray-600 mb-6">
                    Sign up now and start analyzing your financial statements today.
                  </p>
                  <div className="flex justify-center">
                    <Button size="lg" asChild>
                      <Link to="/signup">Create Account</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-gray-500">
          <p>© {new Date().getFullYear()} FinView. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
