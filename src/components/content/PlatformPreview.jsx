import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Instagram, 
  Twitter, 
  MessageCircle,
  Linkedin,
  Facebook
} from 'lucide-react';

export default function PlatformPreview({ title, content, plainContent }) {
  // Strip HTML tags for plain text preview
  const getPlainText = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const textContent = plainContent || getPlainText(content);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          معاينة على المنصات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="instagram">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="instagram">
              <Instagram className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="twitter">
              <Twitter className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="snapchat">
              <MessageCircle className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="linkedin">
              <Linkedin className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="facebook">
              <Facebook className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          {/* Instagram Preview */}
          <TabsContent value="instagram" className="mt-4">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="p-3 border-b flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></div>
                  <div>
                    <p className="font-semibold text-sm">your_account</p>
                  </div>
                </div>
                <div className="aspect-square bg-slate-100 flex items-center justify-center">
                  <p className="text-slate-400 text-sm">صورة المنشور</p>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm mb-1">{title}</p>
                  <p className="text-sm text-slate-700 line-clamp-3">{textContent}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Twitter Preview */}
          <TabsContent value="twitter" className="mt-4">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-bold text-sm">Your Name</p>
                      <p className="text-slate-500 text-sm">@username</p>
                    </div>
                    <p className="text-sm text-slate-900 mb-2">{title}</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {textContent.substring(0, 280)}
                      {textContent.length > 280 && '...'}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">الآن</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Snapchat Preview */}
          <TabsContent value="snapchat" className="mt-4">
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-300 rounded-3xl p-6 aspect-[9/16] flex flex-col">
                <div className="flex-1 flex items-end">
                  <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-4 w-full text-white">
                    <p className="font-bold text-base mb-2">{title}</p>
                    <p className="text-sm">{textContent.substring(0, 150)}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* LinkedIn Preview */}
          <TabsContent value="linkedin" className="mt-4">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-lg border border-slate-200">
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-600"></div>
                  <div>
                    <p className="font-semibold text-sm">Your Name</p>
                    <p className="text-xs text-slate-500">Your Title</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-base mb-2">{title}</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{textContent}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Facebook Preview */}
          <TabsContent value="facebook" className="mt-4">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600"></div>
                  <div>
                    <p className="font-semibold text-sm">Your Page Name</p>
                    <p className="text-xs text-slate-500">الآن</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-base mb-2">{title}</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{textContent}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}