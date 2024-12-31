import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebsiteConfig } from "./WebsiteConfig";
import { KeywordsManagement } from "./KeywordsManagement";
import { EmailSettings } from "./email/EmailSettings";

export const SettingsSection = () => {
  return (
    <Tabs defaultValue="websites" className="space-y-4">
      <TabsList>
        <TabsTrigger value="websites">Website Configuration</TabsTrigger>
        <TabsTrigger value="keywords">Keywords Management</TabsTrigger>
        <TabsTrigger value="email">Email Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="websites">
        <WebsiteConfig />
      </TabsContent>

      <TabsContent value="keywords">
        <KeywordsManagement />
      </TabsContent>

      <TabsContent value="email">
        <EmailSettings />
      </TabsContent>
    </Tabs>
  );
};