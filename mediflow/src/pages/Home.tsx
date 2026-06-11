import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Stethoscope, Building2, ActivitySquare } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center max-w-2xl"
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <ActivitySquare className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">MediFlow AI</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Hospital Flow Intelligence Platform. Select your role to continue to your dashboard.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Card className="h-full border-border/50 hover:border-primary/50 transition-colors bg-card/50 backdrop-blur">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Administrator</CardTitle>
              <CardDescription>Command center operations</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4">
              <Link href="/admin">
                <Button className="w-full" size="lg">Enter Command Center</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card className="h-full border-border/50 hover:border-primary/50 transition-colors bg-card/50 backdrop-blur">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Medical Staff</CardTitle>
              <CardDescription>Manage patients and queues</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4">
              <Link href="/doctor/1">
                <Button className="w-full" size="lg" variant="secondary">Doctor Dashboard</Button>
              </Link>
              <Link href="/triage">
                <Button className="w-full" variant="outline">AI Triage Assessment</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <Card className="h-full border-border/50 hover:border-primary/50 transition-colors bg-card/50 backdrop-blur">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Patient</CardTitle>
              <CardDescription>Registration and tracking</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4">
              <Link href="/patient/register">
                <Button className="w-full" size="lg" variant="secondary">Walk-in Registration</Button>
              </Link>
              <Link href="/appointments">
                <Button className="w-full" variant="outline">Book Appointment</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
