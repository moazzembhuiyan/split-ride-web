import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/ui/motion-tabs";

const AnimatedTabsDemo = <T extends string = string>({
  tabs,
  defaultValue,
  setValue,
  value,
}: {
  tabs: {
    name: string;
    value: T;
  }[];
  defaultValue?: T;
  setValue: (value: T) => void;
  value: T;
}) => {
  return (
    <Tabs value={value} onValueChange={setValue} className="gap-4">
      <TabsList
        className="h-auto w-full md:w-auto gap-1 bg-accent-foreground/20 rounded-4xl md:p-0!"
        activeClassName="rounded-4xl bg-gradient-to-r from-cyan-400 to-violet-500 shadow-sm"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="h-12 min-w-0 px-2 text-xs sm:text-sm whitespace-normal leading-tight rounded-4xl md:px-10 font-semibold bg-transparent text-accent-foreground hover:bg-accent-foreground/20 data-[state=active]:bg-transparent data-[state=active]:text-white"
          >
            {tab.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* <TabsContents className="bg-background mx-1 -mt-2 mb-1 h-full rounded-sm">
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              <p className="text-muted-foreground text-sm">{tab.content}</p>
            </TabsContent>
          ))}
        </TabsContents> */}
    </Tabs>
  );
};

export default AnimatedTabsDemo;
