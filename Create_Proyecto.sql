USE [matec_nrd]
GO

/****** Object:  Table [dbo].[proyectos]    Script Date: 4/05/2026 7:33:32 a. m. ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[proyectos](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [nvarchar](200) NOT NULL,
	[descripcion] [nvarchar](max) NULL,
	[hardware_tipo_id] [int] NOT NULL,
	[subfase_actual_id] [int] NULL,
	[estado] [nvarchar](20) NOT NULL,
	[fecha_inicio] [date] NOT NULL,
	[fecha_objetivo] [date] NULL,
	[lider_id] [int] NULL,
	[creado_en] [datetime2](7) NOT NULL,
	[actualizado_en] [datetime2](7) NOT NULL,
	[completado_en] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[proyectos] ADD  DEFAULT ('activo') FOR [estado]
GO

ALTER TABLE [dbo].[proyectos] ADD  DEFAULT (CONVERT([date],getdate())) FOR [fecha_inicio]
GO

ALTER TABLE [dbo].[proyectos] ADD  DEFAULT (getdate()) FOR [creado_en]
GO

ALTER TABLE [dbo].[proyectos] ADD  DEFAULT (getdate()) FOR [actualizado_en]
GO

ALTER TABLE [dbo].[proyectos]  WITH CHECK ADD FOREIGN KEY([hardware_tipo_id])
REFERENCES [dbo].[hardware_tipos] ([id])
GO

ALTER TABLE [dbo].[proyectos]  WITH CHECK ADD FOREIGN KEY([lider_id])
REFERENCES [dbo].[usuarios] ([id])
GO

ALTER TABLE [dbo].[proyectos]  WITH CHECK ADD FOREIGN KEY([subfase_actual_id])
REFERENCES [dbo].[subfases] ([id])
GO

ALTER TABLE [dbo].[proyectos]  WITH CHECK ADD  CONSTRAINT [CK_proyectos_estado] CHECK  (([estado]='archivado' OR [estado]='completado' OR [estado]='pausado' OR [estado]='activo' OR [estado]='pendiente'))
GO

ALTER TABLE [dbo].[proyectos] CHECK CONSTRAINT [CK_proyectos_estado]
GO

